"use server";

import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import type { RsvpData } from "@/lib/types";

const payload = z.object({
  slug: z.string().max(100),
  token: z.string().max(50),
  guests: z
    .array(z.object({ id: z.guid(), attending: z.boolean(), dietary_restrictions: z.string().max(500).optional() }))
    .max(50),
  companions: z
    .array(
      z.object({
        name: z.string().trim().max(200),
        age_group: z.enum(["adulto", "crianca", "bebe"]),
        dietary_restrictions: z.string().max(500).optional(),
      }),
    )
    .max(20),
  message: z.string().max(1000).optional(),
  consent: z.boolean(),
});

const ERRORS: Record<string, string> = {
  CONSENT_REQUIRED: "Para continuar, aceite o uso dos dados conforme a política de privacidade.",
  INVITE_NOT_FOUND: "Convite não encontrado. Verifique o link recebido.",
  DEADLINE_PASSED: "O prazo de confirmação já terminou. Fale diretamente com os anfitriões.",
};

export async function submitRsvp(input: unknown): Promise<{ data?: RsvpData; error?: string }> {
  const parsed = payload.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos. Recarregue a página e tente novamente." };
  const d = parsed.data;
  if (!d.consent) return { error: ERRORS.CONSENT_REQUIRED };

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("rsvp_submit", {
    p_slug: d.slug,
    p_token: d.token,
    p_guests: d.guests,
    p_companions: d.companions.filter((c) => c.name),
    p_message: d.message ?? null,
    p_consent: d.consent,
  });
  if (error) {
    const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { error: key ? ERRORS[key] : "Não foi possível registrar sua resposta. Tente novamente." };
  }
  return { data: data as RsvpData };
}
