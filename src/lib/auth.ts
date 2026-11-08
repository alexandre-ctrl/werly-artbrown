import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, UserRole } from "./types";

/** Perfil do usuário logado (memoizado por requisição). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
});

export async function requireProfile(roles?: UserRole[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !profile.active) redirect("/login");
  if (roles && !roles.includes(profile.role)) redirect("/painel");
  return profile;
}

/** Para Server Actions: lança erro em vez de redirecionar. */
export async function assertRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !profile.active || !roles.includes(profile.role)) {
    throw new Error("Acesso negado.");
  }
  return profile;
}
