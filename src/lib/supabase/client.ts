import { createBrowserClient } from "@supabase/ssr";

/**
 * NEXT_PUBLIC_SUPABASE_BROWSER_URL (opcional) permite que o navegador acesse o
 * Supabase por outro endereço (ex.: "/" atrás de um proxy reverso local).
 * O nome do cookie de sessão é fixado pela URL do servidor para que navegador
 * e servidor compartilhem a mesma sessão.
 */
export function createClient() {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const browserUrl = process.env.NEXT_PUBLIC_SUPABASE_BROWSER_URL;
  const url = browserUrl ? new URL(browserUrl, window.location.origin).toString().replace(/\/$/, "") : serverUrl;
  const ref = new URL(serverUrl).hostname.split(".")[0];
  return createBrowserClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: `sb-${ref}-auth-token` },
  });
}
