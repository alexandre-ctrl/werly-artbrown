"use server";

import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { firstError, optionalDate, optionalInt, optionalText } from "@/lib/validation";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(200),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.email("E-mail inválido.").max(200).optional()),
  phone: optionalText(40),
  event_type: z.enum(["casamento", "aniversario", "debutante", "corporativo", "bodas", "outro"]),
  event_date: optionalDate,
  guest_estimate: optionalInt(),
  location: optionalText(300),
  message: optionalText(4000),
  consent: z.literal("on", { message: "É preciso aceitar a política de privacidade." }),
});

export async function createLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstError(parsed.error) };
  }
  const d = parsed.data;
  if (formData.get("website")) return { ok: true, message: "Obrigado!" };
  if (!d.email && !d.phone) {
    return { error: "Informe um e-mail ou telefone para contato." };
  }

  const supabase = createAnonClient();
  const { error } = await supabase.from("leads").insert({
    name: d.name,
    email: d.email ?? null,
    phone: d.phone ?? null,
    event_type: d.event_type,
    event_date: d.event_date ?? null,
    guest_estimate: d.guest_estimate ?? null,
    location: d.location ?? null,
    message: d.message ?? null,
    consent: true,
  });
  if (error) {
    console.error("createLead", error);
    return { error: "Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp." };
  }
  return { ok: true, message: "Recebemos sua mensagem! Em breve entraremos em contato. 💛" };
}
