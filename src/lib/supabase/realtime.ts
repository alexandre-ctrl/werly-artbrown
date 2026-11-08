import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Assina mudanças (INSERT/UPDATE/DELETE) de tabelas de um evento.
 * Envia o token da sessão ao Realtime antes de entrar no canal — sem isso a
 * conexão entra como anônima e o RLS bloqueia os eventos.
 */
export function subscribeToEvent(
  name: string,
  eventId: string,
  tables: string[],
  onChange: () => void,
  onStatus?: (live: boolean) => void,
) {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  (async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (cancelled) return;
    if (session) await supabase.realtime.setAuth(session.access_token);
    channel = supabase.channel(name);
    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `event_id=eq.${eventId}` }, onChange);
    }
    channel.subscribe((status) => onStatus?.(status === "SUBSCRIBED"));
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
