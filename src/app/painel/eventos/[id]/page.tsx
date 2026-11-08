import { requireProfile } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import { EVENT_STATUS_LABEL, ROLE_LABEL } from "@/lib/labels";
import { Stat } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Field, Select } from "@/components/fields";
import { EventFields } from "../event-fields";
import {
  assignStaffAction,
  deleteEventAction,
  purgeGuestDataAction,
  removeStaffAction,
  updateEventAction,
} from "../actions";
import type { Profile } from "@/lib/types";

type Summary = { total_guests: number; confirmed: number; declined: number; pending: number; confirmed_children: number };

export default async function EventOverviewPage({ params }: PageProps<"/painel/eventos/[id]">) {
  const { id } = await params;
  const [event, profile] = await Promise.all([getEvent(id), requireProfile()]);
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";
  const canEdit = profile.role !== "portaria";

  const [{ data: summary }, { data: staffRows }, { data: client }] = await Promise.all([
    supabase.from("event_rsvp_summary").select("*").eq("event_id", id).maybeSingle(),
    supabase.from("event_staff").select("user_id, profiles(id, full_name, email, role)").eq("event_id", id),
    supabase.from("clients").select("name, email, phone").eq("id", event.client_id).maybeSingle(),
  ]);
  const s = (summary as Summary | null) ?? { total_guests: 0, confirmed: 0, declined: 0, pending: 0, confirmed_children: 0 };
  const staff = (staffRows ?? []).map((r) => r.profiles as unknown as Profile).filter(Boolean);

  let available: Profile[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["cerimonialista", "portaria"])
      .eq("active", true)
      .order("full_name");
    available = ((data ?? []) as Profile[]).filter((p) => !staff.some((st) => st.id === p.id));
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Convidados" value={s.total_guests} hint={event.guest_limit ? `Limite contratado: ${event.guest_limit}` : undefined} />
        <Stat label="Confirmados" value={s.confirmed} hint={s.confirmed_children ? `${s.confirmed_children} criança(s)` : undefined} />
        <Stat label="Pendentes" value={s.pending} />
        <Stat label="Não irão" value={s.declined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card">
          <h2 className="mb-4 text-2xl">Dados do evento</h2>
          {canEdit ? (
            <ActionForm action={updateEventAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={event.id} />
              <EventFields event={event} />
              {isAdmin ? (
                <Field label="Limite de convidados (contratado)" name="guest_limit" type="number" min={0} defaultValue={event.guest_limit ?? ""} />
              ) : (
                <div>
                  <p className="label">Limite contratado</p>
                  <p className="py-2 text-sm">{event.guest_limit ?? "Sem limite"}</p>
                </div>
              )}
              {profile.role === "admin" || profile.role === "cerimonialista" ? (
                <Select label="Status" name="status" options={EVENT_STATUS_LABEL} defaultValue={event.status} />
              ) : (
                <div>
                  <p className="label">Status</p>
                  <p className="py-2 text-sm">{EVENT_STATUS_LABEL[event.status]}</p>
                </div>
              )}
            </ActionForm>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="label">Cerimônia</dt><dd>{event.ceremony_location} {event.ceremony_address}</dd></div>
              <div><dt className="label">Festa</dt><dd>{event.party_location} {event.party_address}</dd></div>
            </dl>
          )}
        </section>

        <aside className="space-y-6">
          {client && (
            <section className="card">
              <h2 className="mb-2 text-2xl">Cliente</h2>
              <p className="font-semibold">{client.name}</p>
              <p className="text-sm text-muted">{client.email}</p>
              <p className="text-sm text-muted">{client.phone}</p>
            </section>
          )}

          <section className="card">
            <h2 className="mb-3 text-2xl">Equipe</h2>
            {staff.length === 0 && <p className="text-sm text-muted">Nenhum membro atribuído.</p>}
            <ul className="space-y-2">
              {staff.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="font-semibold">{m.full_name || m.email}</span>
                    <span className="block text-xs text-muted">{ROLE_LABEL[m.role]}</span>
                  </span>
                  {isAdmin && (
                    <form action={removeStaffAction}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="user_id" value={m.id} />
                      <button className="text-xs text-red-700 hover:underline">Remover</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {isAdmin && available.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <ActionForm action={assignStaffAction} submitLabel="Atribuir" buttonClassName="btn btn-outline btn-sm" className="space-y-2">
                  <input type="hidden" name="event_id" value={event.id} />
                  <Select
                    label="Adicionar à equipe"
                    name="user_id"
                    options={[["", "Selecione..."], ...available.map((p) => [p.id, `${p.full_name || p.email} (${ROLE_LABEL[p.role]})`] as [string, string])]}
                  />
                </ActionForm>
              </div>
            )}
          </section>

          {isAdmin && (
            <section className="card border-red-100">
              <h2 className="mb-2 text-2xl text-red-800">Zona de risco</h2>
              <p className="mb-3 text-xs text-muted">
                LGPD: após o evento, exclua os dados pessoais dos convidados (nomes, telefones, restrições e check-ins).
              </p>
              <ActionForm action={purgeGuestDataAction} submitLabel="Excluir dados de convidados" buttonClassName="btn btn-danger btn-sm" className="space-y-2">
                <input type="hidden" name="id" value={event.id} />
                <Field label="Digite EXCLUIR" name="confirm" autoComplete="off" />
              </ActionForm>
              <div className="my-4 border-t border-line" />
              <ActionForm action={deleteEventAction} submitLabel="Excluir evento" buttonClassName="btn btn-danger btn-sm" className="space-y-2">
                <input type="hidden" name="id" value={event.id} />
                <Field label="Digite EXCLUIR" name="confirm" autoComplete="off" />
              </ActionForm>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
