"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { firstError, optionalDate, optionalInt, optionalText, optionalTime } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const ALL_ROLES = ["admin", "cerimonialista", "cliente"] as const;

const detailsSchema = z.object({
  type: z.enum(["casamento", "aniversario", "debutante", "corporativo", "bodas", "outro"]),
  title: z.string().trim().min(2, "Informe o título do evento.").max(200),
  partner1_name: optionalText(100),
  partner2_name: optionalText(100),
  event_date: optionalDate,
  ceremony_time: optionalTime,
  ceremony_location: optionalText(200),
  ceremony_address: optionalText(300),
  party_location: optionalText(200),
  party_address: optionalText(300),
  theme: optionalText(300),
  rsvp_deadline: optionalDate,
  notes: optionalText(4000),
});

function detailsToRow(d: z.infer<typeof detailsSchema>) {
  return {
    type: d.type,
    title: d.title,
    partner1_name: d.partner1_name ?? null,
    partner2_name: d.partner2_name ?? null,
    event_date: d.event_date ?? null,
    ceremony_time: d.ceremony_time ?? null,
    ceremony_location: d.ceremony_location ?? null,
    ceremony_address: d.ceremony_address ?? null,
    party_location: d.party_location ?? null,
    party_address: d.party_address ?? null,
    theme: d.theme ?? null,
    rsvp_deadline: d.rsvp_deadline ?? null,
    notes: d.notes ?? null,
  };
}

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await assertRole(["admin"]);
  const parsed = detailsSchema
    .extend({
      client_id: z.guid("Selecione o cliente."),
      guest_limit: optionalInt(0, 100000),
      photo_moderation: z.enum(["auto", "manual"]).default("manual"),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  const base =
    slugify(d.partner1_name && d.partner2_name ? `${d.partner1_name} e ${d.partner2_name}` : d.title) || "evento";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (!count) break;
    slug = `${base}-${i}`;
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...detailsToRow(d),
      client_id: d.client_id,
      guest_limit: d.guest_limit ?? null,
      photo_moderation: d.photo_moderation,
      slug,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("createEvent", error);
    return { error: "Não foi possível criar o evento." };
  }
  revalidatePath("/painel");
  redirect(`/painel/eventos/${data.id}`);
}

export async function updateEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await assertRole([...ALL_ROLES]);
  const id = String(formData.get("id"));
  const parsed = detailsSchema
    .extend({
      guest_limit: optionalInt(0, 100000),
      status: z.enum(["planejamento", "confirmado", "realizado", "cancelado"]).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const row: Record<string, unknown> = detailsToRow(d);
  if (profile.role === "admin") row.guest_limit = d.guest_limit ?? null;
  if ((profile.role === "admin" || profile.role === "cerimonialista") && d.status) row.status = d.status;

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").update(row).eq("id", id).select("id");
  if (error || !data?.length) return { error: "Não foi possível salvar as alterações." };
  revalidatePath(`/painel/eventos/${id}`, "layout");
  return { ok: true, message: "Evento atualizado." };
}

export async function assignStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const eventId = String(formData.get("event_id"));
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return { error: "Selecione um membro da equipe." };
  const supabase = await createClient();
  const { error } = await supabase.from("event_staff").upsert({ event_id: eventId, user_id: userId });
  if (error) return { error: "Não foi possível atribuir." };
  revalidatePath(`/painel/eventos/${eventId}`);
  return { ok: true };
}

export async function removeStaffAction(formData: FormData) {
  await assertRole(["admin"]);
  const eventId = String(formData.get("event_id"));
  const userId = String(formData.get("user_id"));
  const supabase = await createClient();
  await supabase.from("event_staff").delete().eq("event_id", eventId).eq("user_id", userId);
  revalidatePath(`/painel/eventos/${eventId}`);
}

export async function deleteEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const id = String(formData.get("id"));
  if (formData.get("confirm") !== "EXCLUIR") return { error: "Digite EXCLUIR para confirmar." };
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o evento." };
  revalidatePath("/painel");
  redirect("/painel/eventos");
}

/** LGPD: remove dados pessoais dos convidados após o evento. */
export async function purgeGuestDataAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const id = String(formData.get("id"));
  if (formData.get("confirm") !== "EXCLUIR") return { error: "Digite EXCLUIR para confirmar." };
  const supabase = await createClient();
  const { error } = await supabase.from("guest_groups").delete().eq("event_id", id);
  if (error) return { error: "Não foi possível excluir os dados." };
  revalidatePath(`/painel/eventos/${id}`, "layout");
  return { ok: true, message: "Dados de convidados excluídos." };
}
