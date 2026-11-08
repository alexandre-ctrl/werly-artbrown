"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Registra que o convite/lembrete foi enviado pelo WhatsApp. */
export async function markSentAction(eventId: string, groupId: string, kind: "convite" | "lembrete") {
  await assertRole(["admin", "cerimonialista", "cliente"]);
  const supabase = await createClient();
  const column = kind === "lembrete" ? "reminder_sent_at" : "invite_sent_at";
  await supabase
    .from("guest_groups")
    .update({ [column]: new Date().toISOString() })
    .eq("id", groupId)
    .eq("event_id", eventId);
  revalidatePath(`/painel/eventos/${eventId}/rsvp`);
}
