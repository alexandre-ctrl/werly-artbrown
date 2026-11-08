"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { subscribeToEvent } from "@/lib/supabase/realtime";
import { formatDate, formatDateTime, whatsappLink } from "@/lib/format";
import { AGE_LABEL, RSVP_BADGE, RSVP_LABEL } from "@/lib/labels";
import type { AgeGroup, RsvpStatus } from "@/lib/types";
import { WhatsAppIcon } from "@/components/whatsapp-float";
import { markSentAction } from "./actions";

export type BoardGroup = {
  id: string;
  name: string;
  phone: string | null;
  rsvp_status: RsvpStatus;
  responded_at: string | null;
  invite_sent_at: string | null;
  reminder_sent_at: string | null;
  rsvp_message: string | null;
  link: string;
  inviteMessage: string;
  reminderMessage: string;
  members: { name: string; rsvp_status: RsvpStatus; is_companion: boolean; age_group: AgeGroup; dietary_restrictions: string | null }[];
};

type Filter = "todos" | "pendente" | "nao_enviado" | "confirmado" | "recusado";

export function RsvpBoard({
  eventId,
  groups,
  canSend,
  deadline,
}: {
  eventId: string;
  groups: BoardGroup[];
  canSend: boolean;
  deadline: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pendente");
  const [live, setLive] = useState(false);

  // Atualização em tempo real quando um convidado responde
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };
    const unsubscribe = subscribeToEvent(`rsvp-${eventId}`, eventId, ["guest_groups", "guests"], refresh, setLive);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [eventId, router]);

  const people = groups.flatMap((g) => g.members);
  const counts = {
    confirmed: people.filter((p) => p.rsvp_status === "confirmado").length,
    declined: people.filter((p) => p.rsvp_status === "recusado").length,
    pending: people.filter((p) => p.rsvp_status === "pendente").length,
    pendingGroups: groups.filter((g) => g.rsvp_status === "pendente").length,
    notSent: groups.filter((g) => !g.invite_sent_at && g.rsvp_status === "pendente").length,
  };
  const total = people.length || 1;

  const visible = useMemo(
    () =>
      groups.filter((g) => {
        if (filter === "todos") return true;
        if (filter === "nao_enviado") return !g.invite_sent_at && g.rsvp_status === "pendente";
        return g.rsvp_status === filter;
      }),
    [groups, filter],
  );

  const restrictions = people.filter((p) => p.rsvp_status === "confirmado" && p.dietary_restrictions);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {deadline ? `Prazo para confirmar: ${formatDate(deadline)}` : "Sem prazo definido"}
          </p>
          <span className={`badge ${live ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
            {live ? "● Ao vivo" : "Conectando..."}
          </span>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-stone-100">
          <div className="bg-emerald-500" style={{ width: `${(counts.confirmed / total) * 100}%` }} />
          <div className="bg-amber-300" style={{ width: `${(counts.pending / total) * 100}%` }} />
          <div className="bg-stone-300" style={{ width: `${(counts.declined / total) * 100}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><strong className="text-emerald-700">{counts.confirmed}</strong> confirmados</span>
          <span><strong className="text-amber-700">{counts.pending}</strong> pendentes ({counts.pendingGroups} convites)</span>
          <span><strong className="text-stone-600">{counts.declined}</strong> não irão</span>
          <span><strong>{counts.notSent}</strong> convites ainda não enviados</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pendente", "Não responderam"],
            ["nao_enviado", "Não enviados"],
            ["confirmado", "Confirmados"],
            ["recusado", "Não irão"],
            ["todos", "Todos"],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`btn btn-sm ${filter === value ? "btn-primary" : "btn-outline"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-ivory p-10 text-center text-sm text-muted">
          Nenhum convite nesta lista.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((g) => (
            <GroupRow key={g.id} eventId={eventId} group={g} canSend={canSend} />
          ))}
        </div>
      )}

      {restrictions.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-2xl">Restrições alimentares (confirmados)</h3>
          <ul className="space-y-1 text-sm">
            {restrictions.map((p, i) => (
              <li key={i}><strong>{p.name}</strong> — {p.dietary_restrictions}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GroupRow({ eventId, group, canSend }: { eventId: string; group: BoardGroup; canSend: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [, start] = useTransition();
  const isReminder = Boolean(group.invite_sent_at) && group.rsvp_status === "pendente";
  const message = isReminder ? group.reminderMessage : group.inviteMessage;
  const kind = isReminder ? "lembrete" : "convite";

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copie o texto:", text);
    }
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  }

  function markSent() {
    start(() => markSentAction(eventId, group.id, kind));
  }

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl">{group.name}</h3>
            <span className={`badge ${RSVP_BADGE[group.rsvp_status]}`}>{RSVP_LABEL[group.rsvp_status]}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {group.members.map((m) => `${m.name}${m.age_group !== "adulto" ? ` (${AGE_LABEL[m.age_group].toLowerCase()})` : ""}${m.is_companion ? " · acomp." : ""}${group.rsvp_status !== "pendente" ? ` — ${RSVP_LABEL[m.rsvp_status].toLowerCase()}` : ""}`).join(" · ")}
          </p>
          <p className="mt-1 text-xs text-muted">
            {group.responded_at && `Respondeu em ${formatDateTime(group.responded_at)} · `}
            {group.invite_sent_at ? `Convite enviado em ${formatDateTime(group.invite_sent_at)}` : "Convite não enviado"}
            {group.reminder_sent_at && ` · lembrete em ${formatDateTime(group.reminder_sent_at)}`}
          </p>
          {group.rsvp_message && <p className="mt-2 text-sm italic text-gold-700">“{group.rsvp_message}”</p>}
        </div>

        {canSend && (
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => copy(message, "msg")}>
              {copied === "msg" ? "Copiado!" : isReminder ? "Copiar lembrete" : "Copiar mensagem"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => copy(group.link, "link")}>
              {copied === "link" ? "Copiado!" : "Copiar link"}
            </button>
            <a
              href={whatsappLink(group.phone, message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markSent}
              className="btn btn-sm bg-[#25D366] text-white hover:bg-[#1ebe5b]"
            >
              <WhatsAppIcon /> {isReminder ? "Lembrar no WhatsApp" : "Abrir no WhatsApp"}
            </a>
            {!group.invite_sent_at && (
              <button className="text-xs text-muted underline" onClick={markSent} title="Use se enviou por outro meio">
                marcar como enviado
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
