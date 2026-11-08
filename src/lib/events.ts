import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "./supabase/server";
import type { EventRow } from "./types";

/** Carrega o evento respeitando o RLS (404 se o usuário não tiver acesso). */
export const getEvent = cache(async (id: string): Promise<EventRow> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as EventRow;
});
