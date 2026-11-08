"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function updateLeadAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const parsed = z
    .object({
      id: z.guid(),
      status: z.enum(["novo", "em_contato", "proposta", "fechado", "perdido"]),
      notes: z.string().max(4000).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };
  const supabase = await createClient();
  const { id, status, notes } = parsed.data;
  const { error } = await supabase.from("leads").update({ status, notes: notes || null }).eq("id", id);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/painel/leads");
  return { ok: true, message: "Salvo." };
}

export async function deleteLeadAction(formData: FormData) {
  await assertRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", String(formData.get("id")));
  revalidatePath("/painel/leads");
}
