"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError, optionalDate, optionalText } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.");

const schema = z.object({
  id: z.guid(),
  rsvp_title: optionalText(200),
  rsvp_message: optionalText(2000),
  rsvp_primary_color: color,
  rsvp_background_color: color,
  rsvp_deadline: optionalDate,
  whatsapp_template: optionalText(2000),
});

const MAX_COVER = 4 * 1024 * 1024;
const COVER_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function updateInvitePageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin", "cerimonialista", "cliente"]);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { id, ...d } = parsed.data;
  const supabase = await createClient();

  const update: Record<string, unknown> = {
    rsvp_title: d.rsvp_title ?? null,
    rsvp_message: d.rsvp_message ?? null,
    rsvp_primary_color: d.rsvp_primary_color,
    rsvp_background_color: d.rsvp_background_color,
    rsvp_deadline: d.rsvp_deadline ?? null,
    whatsapp_template: d.whatsapp_template ?? null,
  };

  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const ext = COVER_TYPES[cover.type];
    if (!ext) return { error: "A foto de capa deve ser JPG, PNG ou WEBP." };
    if (cover.size > MAX_COVER) return { error: "A foto de capa deve ter no máximo 4 MB." };
    const path = `${id}/capa-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("public-assets").upload(path, cover, { contentType: cover.type });
    if (error) return { error: "Não foi possível enviar a foto de capa." };
    update.rsvp_cover_path = path;
  }
  if (formData.get("remove_cover") === "on") update.rsvp_cover_path = null;

  const { data, error } = await supabase.from("events").update(update).eq("id", id).select("id");
  if (error || !data?.length) return { error: "Não foi possível salvar." };
  revalidatePath(`/painel/eventos/${id}`, "layout");
  return { ok: true, message: "Página do convite atualizada." };
}
