"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError } from "@/lib/validation";

type Result = { error?: string; ok?: boolean; count?: number };

const MANAGERS = ["admin", "cerimonialista", "cliente"] as const;

const side = z.enum(["noivo", "noiva", "ambos"]);
const ageGroup = z.enum(["adulto", "crianca", "bebe"]);
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const guestInput = z.object({
  name: z.string().trim().min(1, "Informe o nome do convidado.").max(200),
  age_group: ageGroup.default("adulto"),
  dietary_restrictions: text(500),
  phone: text(40),
  email: text(200),
});

const groupInput = z.object({
  name: z.string().trim().min(1, "Informe o nome do convite (ex.: Família Silva).").max(200),
  side: side.default("ambos"),
  phone: text(40),
  max_companions: z.coerce.number().int().min(0).max(20).default(0),
  notes: text(1000),
});

function refresh(eventId: string) {
  revalidatePath(`/painel/eventos/${eventId}`, "layout");
}

/** Bloqueia o cliente de ultrapassar o limite contratado (a equipe pode). */
async function checkLimit(eventId: string, adding: number): Promise<string | null> {
  const profile = await assertRole([...MANAGERS]);
  if (profile.role !== "cliente" || adding <= 0) return null;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("guest_limit").eq("id", eventId).single();
  if (!event?.guest_limit) return null;
  const { count } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("added_at_door", false);
  if ((count ?? 0) + adding > event.guest_limit) {
    return `O limite contratado é de ${event.guest_limit} convidados (já cadastrados: ${count ?? 0}). Fale com a ArtBrown para ampliar.`;
  }
  return null;
}

export async function createGroupAction(eventId: string, input: unknown): Promise<Result> {
  await assertRole([...MANAGERS]);
  const parsed = groupInput.extend({ guests: z.array(guestInput).min(1, "Adicione ao menos um convidado.") }).safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { guests, ...group } = parsed.data;

  const limitError = await checkLimit(eventId, guests.length);
  if (limitError) return { error: limitError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guest_groups")
    .insert({ ...group, event_id: eventId })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível criar o convite." };

  const { error: gErr } = await supabase
    .from("guests")
    .insert(guests.map((g) => ({ ...g, event_id: eventId, group_id: data.id, side: group.side })));
  if (gErr) {
    await supabase.from("guest_groups").delete().eq("id", data.id);
    return { error: "Não foi possível salvar os convidados." };
  }
  refresh(eventId);
  return { ok: true };
}

export async function updateGroupAction(eventId: string, groupId: string, input: unknown): Promise<Result> {
  await assertRole([...MANAGERS]);
  const parsed = groupInput
    .extend({ rsvp_status: z.enum(["pendente", "confirmado", "recusado"]).optional() })
    .safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("guest_groups").update(parsed.data).eq("id", groupId).eq("event_id", eventId);
  if (error) return { error: "Não foi possível salvar o convite." };
  // Mantém o lado dos convidados alinhado ao convite
  await supabase.from("guests").update({ side: parsed.data.side }).eq("group_id", groupId);
  refresh(eventId);
  return { ok: true };
}

export async function deleteGroupAction(eventId: string, groupId: string): Promise<Result> {
  await assertRole([...MANAGERS]);
  const supabase = await createClient();
  const { error } = await supabase.from("guest_groups").delete().eq("id", groupId).eq("event_id", eventId);
  if (error) return { error: "Não foi possível excluir." };
  refresh(eventId);
  return { ok: true };
}

export async function addGuestAction(eventId: string, groupId: string, input: unknown): Promise<Result> {
  await assertRole([...MANAGERS]);
  const parsed = guestInput.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const limitError = await checkLimit(eventId, 1);
  if (limitError) return { error: limitError };
  const supabase = await createClient();
  const { data: group } = await supabase.from("guest_groups").select("side").eq("id", groupId).eq("event_id", eventId).single();
  if (!group) return { error: "Convite não encontrado." };
  const { error } = await supabase
    .from("guests")
    .insert({ ...parsed.data, event_id: eventId, group_id: groupId, side: group.side });
  if (error) return { error: "Não foi possível adicionar." };
  refresh(eventId);
  return { ok: true };
}

export async function updateGuestAction(eventId: string, guestId: string, input: unknown): Promise<Result> {
  await assertRole([...MANAGERS]);
  const parsed = guestInput
    .pick({ name: true, age_group: true, dietary_restrictions: true })
    .extend({ rsvp_status: z.enum(["pendente", "confirmado", "recusado"]) })
    .safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("guests").update(parsed.data).eq("id", guestId).eq("event_id", eventId);
  if (error) return { error: "Não foi possível salvar." };
  await syncGroupStatus(eventId, guestId);
  refresh(eventId);
  return { ok: true };
}

/** Recalcula o status do convite quando a equipe altera a resposta manualmente. */
async function syncGroupStatus(eventId: string, guestId: string) {
  const supabase = await createClient();
  const { data: guest } = await supabase.from("guests").select("group_id").eq("id", guestId).single();
  if (!guest) return;
  const { data: members } = await supabase.from("guests").select("rsvp_status").eq("group_id", guest.group_id);
  const statuses = (members ?? []).map((m) => m.rsvp_status);
  const status = statuses.includes("confirmado")
    ? "confirmado"
    : statuses.length && statuses.every((s) => s === "recusado")
      ? "recusado"
      : "pendente";
  await supabase.from("guest_groups").update({ rsvp_status: status }).eq("id", guest.group_id).eq("event_id", eventId);
}

export async function deleteGuestAction(eventId: string, guestId: string): Promise<Result> {
  await assertRole([...MANAGERS]);
  const supabase = await createClient();
  const { data: guest } = await supabase.from("guests").select("group_id").eq("id", guestId).single();
  const { error } = await supabase.from("guests").delete().eq("id", guestId).eq("event_id", eventId);
  if (error) return { error: "Não foi possível excluir." };
  if (guest) {
    const { count } = await supabase.from("guests").select("id", { count: "exact", head: true }).eq("group_id", guest.group_id);
    if (!count) await supabase.from("guest_groups").delete().eq("id", guest.group_id);
  }
  refresh(eventId);
  return { ok: true };
}

const importRow = z.object({
  group: z.string().trim().max(200).optional(),
  name: z.string().trim().min(1).max(200),
  age_group: ageGroup.default("adulto"),
  side: side.default("ambos"),
  phone: text(40),
  email: text(200),
  dietary_restrictions: text(500),
  max_companions: z.coerce.number().int().min(0).max(20).default(0),
});

/** Importação em lote (CSV/Excel já convertido no navegador). */
export async function importGuestsAction(eventId: string, rows: unknown): Promise<Result> {
  await assertRole([...MANAGERS]);
  const parsed = z.array(importRow).min(1, "Nenhuma linha válida.").max(2000, "Máximo de 2000 linhas por importação.").safeParse(rows);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const limitError = await checkLimit(eventId, parsed.data.length);
  if (limitError) return { error: limitError };

  // Agrupa por "convite"; linhas sem grupo viram convites individuais
  const groups = new Map<string, z.infer<typeof importRow>[]>();
  parsed.data.forEach((row, i) => {
    const key = row.group ? row.group.toLowerCase() : `__single_${i}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  const supabase = await createClient();
  let imported = 0;
  for (const members of groups.values()) {
    const first = members[0];
    const { data: group, error } = await supabase
      .from("guest_groups")
      .insert({
        event_id: eventId,
        name: first.group || first.name,
        side: first.side,
        phone: members.find((m) => m.phone)?.phone ?? null,
        max_companions: Math.max(...members.map((m) => m.max_companions)),
      })
      .select("id")
      .single();
    if (error) return { error: `Erro ao importar "${first.group || first.name}". ${imported} convidados importados.` };
    const { error: gErr } = await supabase.from("guests").insert(
      members.map((m) => ({
        event_id: eventId,
        group_id: group.id,
        name: m.name,
        age_group: m.age_group,
        side: m.side,
        phone: m.phone,
        email: m.email,
        dietary_restrictions: m.dietary_restrictions,
      })),
    );
    if (gErr) return { error: `Erro ao importar "${first.group || first.name}". ${imported} convidados importados.` };
    imported += members.length;
  }
  refresh(eventId);
  return { ok: true, count: imported };
}
