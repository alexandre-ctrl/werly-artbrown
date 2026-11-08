import { Field, Select, TextArea } from "@/components/fields";
import { EVENT_TYPE_LABEL } from "@/lib/labels";
import type { EventRow } from "@/lib/types";

/** Campos de dados do evento (criação e edição). */
export function EventFields({ event }: { event?: Partial<EventRow> }) {
  return (
    <>
      <Select label="Tipo de evento" name="type" options={EVENT_TYPE_LABEL} defaultValue={event?.type ?? "casamento"} />
      <Field label="Título *" name="title" required defaultValue={event?.title ?? ""} placeholder="Casamento Ana & Pedro" />
      <Field label="Noiva / Anfitrião(ã) 1" name="partner1_name" defaultValue={event?.partner1_name ?? ""} />
      <Field label="Noivo / Anfitrião(ã) 2" name="partner2_name" defaultValue={event?.partner2_name ?? ""} />
      <Field label="Data" name="event_date" type="date" defaultValue={event?.event_date ?? ""} />
      <Field label="Horário da cerimônia" name="ceremony_time" type="time" defaultValue={event?.ceremony_time?.slice(0, 5) ?? ""} />
      <Field label="Local da cerimônia" name="ceremony_location" defaultValue={event?.ceremony_location ?? ""} />
      <Field label="Endereço da cerimônia" name="ceremony_address" defaultValue={event?.ceremony_address ?? ""} />
      <Field label="Local da festa" name="party_location" defaultValue={event?.party_location ?? ""} />
      <Field label="Endereço da festa" name="party_address" defaultValue={event?.party_address ?? ""} />
      <Field label="Tema / estilo" name="theme" defaultValue={event?.theme ?? ""} className="sm:col-span-2" />
      <Field label="Prazo para confirmar presença" name="rsvp_deadline" type="date" defaultValue={event?.rsvp_deadline ?? ""} />
      <TextArea label="Observações internas" name="notes" defaultValue={event?.notes ?? ""} className="sm:col-span-2" />
    </>
  );
}
