export const TIME_ZONE = "America/Sao_Paulo";

/** Formata uma data "AAAA-MM-DD" (coluna date) sem deslocamento de fuso. */
export function formatDate(value: string | null | undefined, style: "long" | "short" = "long") {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    ...(style === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" }),
  }).format(date);
}

export function formatWeekday(value: string | null | undefined) {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

/** Formata timestamptz no fuso de São Paulo. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 5).replace(":", "h");
}

/** Data de hoje (AAAA-MM-DD) no fuso de São Paulo. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

/** Dias entre hoje e a data (negativo se já passou). */
export function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const today = Date.parse(todayISO());
  return Math.round((Date.parse(value.slice(0, 10)) - today) / 86_400_000);
}

/** Normaliza telefone para o formato do wa.me (somente dígitos, com DDI 55). */
export function toWhatsAppNumber(phone: string | null | undefined) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 12 ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, text: string) {
  const number = toWhatsAppNumber(phone);
  const encoded = encodeURIComponent(text);
  return number ? `https://wa.me/${number}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function coupleNames(event: { partner1_name: string | null; partner2_name: string | null; title: string }) {
  if (event.partner1_name && event.partner2_name) return `${event.partner1_name} & ${event.partner2_name}`;
  return event.partner1_name || event.partner2_name || event.title;
}

export function publicStorageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
