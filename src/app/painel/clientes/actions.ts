"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createLoginUser, resetUserPassword } from "@/lib/users";
import { firstError, optionalText } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente.").max(200),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.email("E-mail inválido.").optional()),
  phone: optionalText(40),
  document: optionalText(40),
  notes: optionalText(4000),
});

export async function createClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const password = String(formData.get("password") ?? "");
  const giveAccess = formData.get("give_access") === "on";
  let userId: string | null = null;

  if (giveAccess) {
    if (!d.email) return { error: "Informe o e-mail para criar o acesso do cliente." };
    if (password.length < 8) return { error: "A senha inicial precisa ter ao menos 8 caracteres." };
    const created = await createLoginUser({ email: d.email, password, fullName: d.name, phone: d.phone, role: "cliente" });
    if (created.error) return { error: created.error };
    userId = created.id!;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: d.name,
      email: d.email ?? null,
      phone: d.phone ?? null,
      document: d.document ?? null,
      notes: d.notes ?? null,
      user_id: userId,
    })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível salvar o cliente." };

  revalidatePath("/painel/clientes");
  redirect(`/painel/clientes/${data.id}`);
}

export async function updateClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const id = String(formData.get("id"));
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: d.name,
      email: d.email ?? null,
      phone: d.phone ?? null,
      document: d.document ?? null,
      notes: d.notes ?? null,
    })
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath(`/painel/clientes/${id}`);
  return { ok: true, message: "Dados salvos." };
}

export async function grantClientAccessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertRole(["admin"]);
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) return { error: "Cliente não encontrado." };

  if (client.user_id) {
    const res = await resetUserPassword(client.user_id, password);
    return res.error ? { error: res.error } : { ok: true, message: "Senha redefinida." };
  }
  if (!client.email) return { error: "Cadastre o e-mail do cliente antes de criar o acesso." };
  if (password.length < 8) return { error: "A senha precisa ter ao menos 8 caracteres." };
  const created = await createLoginUser({
    email: client.email,
    password,
    fullName: client.name,
    phone: client.phone,
    role: "cliente",
  });
  if (created.error) return { error: created.error };
  await supabase.from("clients").update({ user_id: created.id }).eq("id", id);
  revalidatePath(`/painel/clientes/${id}`);
  return { ok: true, message: "Acesso criado. Envie o e-mail e a senha ao cliente." };
}
