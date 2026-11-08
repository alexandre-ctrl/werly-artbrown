import { coupleNames, formatDate, siteUrl } from "./format";

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Olá, {nome}! 💛\n\nCom muita alegria convidamos você para o casamento de {noivos}, no dia {data}.\n\nConfirme sua presença pelo link abaixo{prazo}:\n{link}\n\nCom carinho,\n{noivos}";

export const GENERIC_WHATSAPP_TEMPLATE =
  "Olá, {nome}! 💛\n\nCom muita alegria convidamos você para {evento}, no dia {data}.\n\nConfirme sua presença pelo link abaixo{prazo}:\n{link}\n\nCom carinho,\n{noivos}";

export const DEFAULT_REMINDER_TEMPLATE =
  "Olá, {nome}! Passando para lembrar de confirmar sua presença em {evento} ({data}){prazo}:\n{link}\n\nObrigado! 💛";

export function rsvpLink(slug: string, token: string) {
  return `${siteUrl()}/c/${slug}/${token}`;
}

type EventForMessage = {
  type: string;
  slug: string;
  title: string;
  partner1_name: string | null;
  partner2_name: string | null;
  event_date: string | null;
  rsvp_deadline: string | null;
  whatsapp_template: string | null;
};

export function defaultTemplateFor(type: string) {
  return type === "casamento" ? DEFAULT_WHATSAPP_TEMPLATE : GENERIC_WHATSAPP_TEMPLATE;
}

export function buildInviteMessage(
  event: EventForMessage,
  group: { name: string; invite_token: string },
  kind: "convite" | "lembrete" = "convite",
) {
  const template =
    kind === "lembrete" ? DEFAULT_REMINDER_TEMPLATE : event.whatsapp_template?.trim() || defaultTemplateFor(event.type);
  const values: Record<string, string> = {
    nome: group.name,
    noivos: coupleNames(event),
    data: formatDate(event.event_date),
    prazo: event.rsvp_deadline ? ` até ${formatDate(event.rsvp_deadline)}` : "",
    link: rsvpLink(event.slug, group.invite_token),
    evento: event.title,
  };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
