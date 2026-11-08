"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createLoginUser, resetUserPassword, setUserBanned } from "@/lib/users";
import { firstError, optionalText } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const roles = z.enum(["admin", "cerimonialista", "portaria"]);

export async function createStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Informe o nome.").max(200),
      email: z.email("E-mail inválido."),
      phone: optionalText(40),
      role: roles,
      password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const res = await createLoginUser({ email: d.email, password: d.password, fullName: d.full_name, phone: d.phone, role: d.role });
  if (res.error) return { error: res.error };
  revalidatePath("/painel/equipe");
  return { ok: true, message: "Membro cadastrado. Envie o e-mail e a senha para a pessoa." };
}

export async function updateStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await assertRole(["admin"]);
  const parsed = z
    .object({
      id: z.guid(),
      role: roles,
      active: z.enum(["true", "false"]),
      password: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  if (d.id === me.id && (d.role !== "admin" || d.active === "false")) {
    return { error: "Você não pode remover o seu próprio acesso de administrador." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role: d.role, active: d.active === "true" }).eq("id", d.id);
  if (error) return { error: "Não foi possível salvar." };
  await setUserBanned(d.id, d.active === "false");
  if (d.password) {
    const res = await resetUserPassword(d.id, d.password);
    if (res.error) return { error: res.error };
  }
  revalidatePath("/painel/equipe");
  return { ok: true, message: "Salvo." };
}
