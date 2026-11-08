"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError, optionalText } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

export async function updateAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const parsed = z
    .object({ full_name: z.string().trim().min(2, "Informe seu nome.").max(200), phone: optionalText(40) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone ?? null })
    .eq("id", profile.id);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Dados atualizados." };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "A nova senha precisa ter ao menos 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível alterar a senha." };
  return { ok: true, message: "Senha alterada." };
}
