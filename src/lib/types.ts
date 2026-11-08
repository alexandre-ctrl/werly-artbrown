export type UserRole = "admin" | "cerimonialista" | "cliente" | "portaria";
export type EventType = "casamento" | "aniversario" | "debutante" | "corporativo" | "bodas" | "outro";
export type EventStatus = "planejamento" | "confirmado" | "realizado" | "cancelado";
export type RsvpStatus = "pendente" | "confirmado" | "recusado";
export type GuestSide = "noivo" | "noiva" | "ambos";
export type AgeGroup = "adulto" | "crianca" | "bebe";
export type LeadStatus = "novo" | "em_contato" | "proposta" | "fechado" | "perdido";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  client_id: string;
  type: EventType;
  status: EventStatus;
  title: string;
  slug: string;
  partner1_name: string | null;
  partner2_name: string | null;
  event_date: string | null;
  ceremony_time: string | null;
  ceremony_location: string | null;
  ceremony_address: string | null;
  party_location: string | null;
  party_address: string | null;
  theme: string | null;
  guest_limit: number | null;
  rsvp_deadline: string | null;
  rsvp_title: string | null;
  rsvp_message: string | null;
  rsvp_cover_path: string | null;
  rsvp_primary_color: string;
  rsvp_background_color: string;
  whatsapp_template: string | null;
  photo_moderation: "auto" | "manual";
  notes: string | null;
  created_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string;
  name: string;
  side: GuestSide;
  phone: string | null;
  invite_token: string;
  max_companions: number;
  rsvp_status: RsvpStatus;
  responded_at: string | null;
  rsvp_message: string | null;
  consent_at: string | null;
  invite_sent_at: string | null;
  reminder_sent_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  group_id: string;
  name: string;
  age_group: AgeGroup;
  is_companion: boolean;
  side: GuestSide;
  phone: string | null;
  email: string | null;
  dietary_restrictions: string | null;
  rsvp_status: RsvpStatus;
  table_id: string | null;
  added_at_door: boolean;
  notes: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  event_type: EventType;
  event_date: string | null;
  guest_estimate: number | null;
  location: string | null;
  message: string | null;
  consent: boolean;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
}

/** Retorno padrão das Server Actions usadas com useActionState. */
export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

/** Dados retornados pela função pública rsvp_get. */
export interface RsvpData {
  event: {
    type: EventType;
    title: string;
    partner1_name: string | null;
    partner2_name: string | null;
    event_date: string | null;
    ceremony_time: string | null;
    ceremony_location: string | null;
    ceremony_address: string | null;
    party_location: string | null;
    party_address: string | null;
    theme: string | null;
    rsvp_title: string | null;
    rsvp_message: string | null;
    rsvp_cover_path: string | null;
    rsvp_primary_color: string;
    rsvp_background_color: string;
    rsvp_deadline: string | null;
    deadline_passed: boolean;
  };
  group: {
    name: string;
    max_companions: number;
    rsvp_status: RsvpStatus;
    responded_at: string | null;
    rsvp_message: string | null;
  };
  guests: {
    id: string;
    name: string;
    age_group: AgeGroup;
    is_companion: boolean;
    rsvp_status: RsvpStatus;
    dietary_restrictions: string | null;
  }[];
}
