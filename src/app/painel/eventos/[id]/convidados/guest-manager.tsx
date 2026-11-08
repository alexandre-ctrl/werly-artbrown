"use client";

import { useMemo, useState, useTransition } from "react";
import { AGE_LABEL, RSVP_BADGE, RSVP_LABEL, SIDE_LABEL } from "@/lib/labels";
import type { AgeGroup, Guest, GuestGroup, GuestSide, RsvpStatus } from "@/lib/types";
import {
  addGuestAction,
  createGroupAction,
  deleteGroupAction,
  deleteGuestAction,
  updateGroupAction,
  updateGuestAction,
} from "./actions";
import { ImportGuests } from "./import-guests";

type Props = {
  eventId: string;
  eventType: string;
  guestLimit: number | null;
  groups: GuestGroup[];
  guests: Guest[];
  readOnly: boolean;
};

export function GuestManager({ eventId, eventType, guestLimit, groups, guests, readOnly }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | RsvpStatus>("");
  const [side, setSide] = useState<"" | GuestSide>("");
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const isWedding = eventType === "casamento";

  const byGroup = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const g of guests) map.set(g.group_id, [...(map.get(g.group_id) ?? []), g]);
    return map;
  }, [guests]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return groups.filter((group) => {
      if (status && group.rsvp_status !== status) return false;
      if (side && group.side !== side) return false;
      if (!q) return true;
      const members = byGroup.get(group.id) ?? [];
      return normalize(group.name).includes(q) || members.some((m) => normalize(m.name).includes(q));
    });
  }, [groups, byGroup, query, status, side]);

  const total = guests.filter((g) => !g.added_at_door).length;
  const children = guests.filter((g) => g.age_group !== "adulto").length;
  const restrictions = guests.filter((g) => g.dietary_restrictions).length;
  const overLimit = guestLimit !== null && total > guestLimit;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <strong className="text-ink">{total}</strong> convidados em <strong className="text-ink">{groups.length}</strong> convites
          {guestLimit !== null && (
            <span className={overLimit ? "font-semibold text-red-700" : ""}> · limite contratado {guestLimit}</span>
          )}
          {" · "}{children} criança(s) · {restrictions} com restrição alimentar
        </p>
        {!readOnly && (
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => setShowImport((v) => !v)}>Importar CSV/Excel</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew((v) => !v)}>Novo convite</button>
          </div>
        )}
      </div>

      {showImport && <ImportGuests eventId={eventId} onDone={() => setShowImport(false)} />}
      {showNew && <NewGroupForm eventId={eventId} isWedding={isWedding} onDone={() => setShowNew(false)} />}

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar convidado ou família"
          className="input max-w-xs"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as RsvpStatus | "")} className="input w-auto">
          <option value="">Todas as respostas</option>
          {Object.entries(RSVP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {isWedding && (
          <select value={side} onChange={(e) => setSide(e.target.value as GuestSide | "")} className="input w-auto">
            <option value="">Todos os lados</option>
            {Object.entries(SIDE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-ivory p-10 text-center text-sm text-muted">
          {groups.length === 0 ? "Nenhum convidado ainda. Crie um convite ou importe sua lista." : "Nenhum resultado para o filtro."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              eventId={eventId}
              group={group}
              members={byGroup.get(group.id) ?? []}
              isWedding={isWedding}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function normalize(v: string) {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/* ------------------------------------------------------------------ */

type DraftGuest = { name: string; age_group: AgeGroup; dietary_restrictions: string };
const emptyGuest = (): DraftGuest => ({ name: "", age_group: "adulto", dietary_restrictions: "" });

function NewGroupForm({ eventId, isWedding, onDone }: { eventId: string; isWedding: boolean; onDone: () => void }) {
  const [name, setName] = useState("");
  const [side, setSide] = useState<GuestSide>("ambos");
  const [phone, setPhone] = useState("");
  const [maxCompanions, setMaxCompanions] = useState(0);
  const [members, setMembers] = useState<DraftGuest[]>([emptyGuest()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(i: number, patch: Partial<DraftGuest>) {
    setMembers((list) => list.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const guests = members.filter((m) => m.name.trim());
    start(async () => {
      const res = await createGroupAction(eventId, {
        name: name || guests[0]?.name,
        side,
        phone,
        max_companions: maxCompanions,
        guests,
      });
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-4 border-gold-200">
      <h3 className="text-2xl">Novo convite</h3>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Nome do convite (família/grupo)</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Família Silva" />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" type="tel" />
        </div>
        <div>
          <label className="label">Acompanhantes extras</label>
          <input className="input" type="number" min={0} max={20} value={maxCompanions} onChange={(e) => setMaxCompanions(Number(e.target.value))} />
        </div>
        {isWedding && (
          <div>
            <label className="label">Lado</label>
            <select className="input" value={side} onChange={(e) => setSide(e.target.value as GuestSide)}>
              {Object.entries(SIDE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="label">Pessoas deste convite</p>
        {members.map((m, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
            <input className="input" placeholder="Nome completo" value={m.name} onChange={(e) => update(i, { name: e.target.value })} />
            <select className="input" value={m.age_group} onChange={(e) => update(i, { age_group: e.target.value as AgeGroup })}>
              {Object.entries(AGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input className="input" placeholder="Restrição alimentar (opcional)" value={m.dietary_restrictions} onChange={(e) => update(i, { dietary_restrictions: e.target.value })} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMembers((l) => l.filter((_, idx) => idx !== i))} disabled={members.length === 1}>
              Remover
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMembers((l) => [...l, emptyGuest()])}>+ Adicionar pessoa</button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar convite"}</button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function GroupCard({
  eventId,
  group,
  members,
  isWedding,
  readOnly,
}: {
  eventId: string;
  group: GuestGroup;
  members: Guest[];
  isWedding: boolean;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else after?.();
    });
  }

  return (
    <article className={`card ${pending ? "opacity-60" : ""}`}>
      {editing ? (
        <GroupEditForm
          group={group}
          isWedding={isWedding}
          onCancel={() => setEditing(false)}
          onSave={(data) => run(() => updateGroupAction(eventId, group.id, data), () => setEditing(false))}
        />
      ) : (
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-xl">{group.name}</h3>
            <p className="text-xs text-muted">
              {isWedding && `${SIDE_LABEL[group.side]} · `}
              {group.phone || "sem telefone"}
              {group.max_companions > 0 && ` · até ${group.max_companions} acompanhante(s) extra(s)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${RSVP_BADGE[group.rsvp_status]}`}>{RSVP_LABEL[group.rsvp_status]}</span>
            {!readOnly && (
              <>
                <button className="text-xs font-semibold text-gold-700 hover:underline" onClick={() => setEditing(true)}>Editar</button>
                <button
                  className="text-xs font-semibold text-red-700 hover:underline"
                  onClick={() => confirm(`Excluir o convite "${group.name}" e todos os seus convidados?`) && run(() => deleteGroupAction(eventId, group.id))}
                >
                  Excluir
                </button>
              </>
            )}
          </div>
        </header>
      )}

      {group.rsvp_message && (
        <p className="mt-2 rounded-lg bg-gold-50 px-3 py-2 text-sm italic text-gold-700">“{group.rsvp_message}”</p>
      )}

      <ul className="mt-3 divide-y divide-line/70">
        {members.map((guest) => (
          <GuestRow key={guest.id} eventId={eventId} guest={guest} readOnly={readOnly} onError={setError} />
        ))}
      </ul>

      {!readOnly &&
        (adding ? (
          <AddGuestForm
            onCancel={() => setAdding(false)}
            onSave={(data) => run(() => addGuestAction(eventId, group.id, data), () => setAdding(false))}
          />
        ) : (
          <button className="mt-2 text-xs font-semibold text-gold-700 hover:underline" onClick={() => setAdding(true)}>
            + Adicionar pessoa
          </button>
        ))}
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </article>
  );
}

function GroupEditForm({
  group,
  isWedding,
  onCancel,
  onSave,
}: {
  group: GuestGroup;
  isWedding: boolean;
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <div className="sm:col-span-2">
        <label className="label">Nome do convite</label>
        <input name="name" className="input" defaultValue={group.name} required />
      </div>
      <div>
        <label className="label">WhatsApp</label>
        <input name="phone" className="input" defaultValue={group.phone ?? ""} type="tel" />
      </div>
      <div>
        <label className="label">Acompanhantes extras</label>
        <input name="max_companions" className="input" type="number" min={0} max={20} defaultValue={group.max_companions} />
      </div>
      {isWedding ? (
        <div>
          <label className="label">Lado</label>
          <select name="side" className="input" defaultValue={group.side}>
            {Object.entries(SIDE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      ) : (
        <input type="hidden" name="side" value={group.side} />
      )}
      <div className="sm:col-span-3">
        <label className="label">Observações</label>
        <input name="notes" className="input" defaultValue={group.notes ?? ""} />
      </div>
      <div className="flex gap-2 sm:col-span-4">
        <button className="btn btn-primary btn-sm">Salvar</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

function GuestRow({
  eventId,
  guest,
  readOnly,
  onError,
}: {
  eventId: string;
  guest: Guest;
  readOnly: boolean;
  onError: (e: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    onError(null);
    start(async () => {
      const res = await fn();
      if (res.error) onError(res.error);
      else after?.();
    });
  }

  if (editing) {
    return (
      <li className="py-2">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_120px_140px_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            run(() => updateGuestAction(eventId, guest.id, data), () => setEditing(false));
          }}
        >
          <input name="name" className="input" defaultValue={guest.name} required />
          <select name="age_group" className="input" defaultValue={guest.age_group}>
            {Object.entries(AGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select name="rsvp_status" className="input" defaultValue={guest.rsvp_status}>
            {Object.entries(RSVP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input name="dietary_restrictions" className="input" defaultValue={guest.dietary_restrictions ?? ""} placeholder="Restrição alimentar" />
          <div className="flex gap-1">
            <button className="btn btn-primary btn-sm" disabled={pending}>Salvar</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>×</button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`flex flex-wrap items-center justify-between gap-2 py-2 text-sm ${pending ? "opacity-50" : ""}`}>
      <span>
        <span className="font-semibold">{guest.name}</span>
        {guest.age_group !== "adulto" && <span className="ml-2 badge bg-sky-50 text-sky-800">{AGE_LABEL[guest.age_group]}</span>}
        {guest.is_companion && <span className="ml-2 badge bg-gold-50 text-gold-700">Acompanhante</span>}
        {guest.added_at_door && <span className="ml-2 badge bg-purple-50 text-purple-800">Última hora</span>}
        {guest.dietary_restrictions && <span className="block text-xs text-muted">🍽 {guest.dietary_restrictions}</span>}
      </span>
      <span className="flex items-center gap-3">
        <span className={`badge ${RSVP_BADGE[guest.rsvp_status]}`}>{RSVP_LABEL[guest.rsvp_status]}</span>
        {!readOnly && (
          <>
            <button className="text-xs text-gold-700 hover:underline" onClick={() => setEditing(true)}>Editar</button>
            <button
              className="text-xs text-red-700 hover:underline"
              onClick={() => confirm(`Remover ${guest.name}?`) && run(() => deleteGuestAction(eventId, guest.id))}
            >
              Remover
            </button>
          </>
        )}
      </span>
    </li>
  );
}

function AddGuestForm({ onCancel, onSave }: { onCancel: () => void; onSave: (data: Record<string, unknown>) => void }) {
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <input name="name" className="input" placeholder="Nome completo" required autoFocus />
      <select name="age_group" className="input" defaultValue="adulto">
        {Object.entries(AGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input name="dietary_restrictions" className="input" placeholder="Restrição alimentar" />
      <div className="flex gap-1">
        <button className="btn btn-primary btn-sm">Adicionar</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>×</button>
      </div>
    </form>
  );
}
