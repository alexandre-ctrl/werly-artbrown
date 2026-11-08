import "server-only";
import { createAdminClient } from "./supabase/server";
import type { UserRole } from "./types";

/**
 * Cria um usuário de login (somente chamar depois de assertRole(["admin"])).
 * O papel vai em app_metadata, que o trigger handle_new_user copia para profiles.
 */
export async function createLoginUser(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
}): Promise<{ id?: string; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: input.role },
    user_metadata: { full_name: input.fullName, phone: input.phone ?? undefined },
  });
  if (error || !data.user) {
    const msg = error?.message ?? "";
    if (/already|registered|exists/i.test(msg)) return { error: "Já existe um usuário com este e-mail." };
    if (/password/i.test(msg)) return { error: "Senha fraca: use pelo menos 8 caracteres." };
    return { error: "Não foi possível criar o acesso." };
  }
  return { id: data.user.id };
}

export async function setUserBanned(userId: string, banned: boolean) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? "876000h" : "none" });
}

export async function resetUserPassword(userId: string, password: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  return error ? { error: "Não foi possível alterar a senha (mínimo 8 caracteres)." } : {};
}
