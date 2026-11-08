import type { AgeGroup, EventStatus, EventType, GuestSide, LeadStatus, RsvpStatus, UserRole } from "./types";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  cerimonialista: "Cerimonialista",
  cliente: "Cliente",
  portaria: "Portaria",
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  casamento: "Casamento",
  aniversario: "Aniversário",
  debutante: "15 anos",
  corporativo: "Corporativo",
  bodas: "Bodas",
  outro: "Outro",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  planejamento: "Em planejamento",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Não irá",
};

export const RSVP_BADGE: Record<RsvpStatus, string> = {
  pendente: "bg-amber-50 text-amber-800",
  confirmado: "bg-emerald-50 text-emerald-800",
  recusado: "bg-stone-100 text-stone-600",
};

export const SIDE_LABEL: Record<GuestSide, string> = {
  noiva: "Lado da noiva",
  noivo: "Lado do noivo",
  ambos: "Ambos",
};

export const AGE_LABEL: Record<AgeGroup, string> = {
  adulto: "Adulto",
  crianca: "Criança",
  bebe: "Bebê",
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  proposta: "Proposta enviada",
  fechado: "Fechado",
  perdido: "Perdido",
};
