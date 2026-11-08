"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import { AGE_LABEL } from "@/lib/labels";
import type { AgeGroup, RsvpData } from "@/lib/types";
import { submitRsvp } from "./actions";

type Answer = { attending: boolean | null; dietary_restrictions: string };
type Companion = { name: string; age_group: AgeGroup; dietary_restrictions: string };

export function RsvpForm({ slug, token, initial }: { slug: string; token: string; initial: RsvpData }) {
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState(initial.group.rsvp_status === "pendente");
  const invited = data.guests.filter((g) => !g.is_companion);
  const max = data.group.max_companions;
  const accent = { background: "var(--accent)" };

  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(
      invited.map((g) => [
        g.id,
        {
          attending: g.rsvp_status === "pendente" ? null : g.rsvp_status === "confirmado",
          dietary_restrictions: g.dietary_restrictions ?? "",
        },
      ]),
    ),
  );
  const [companions, setCompanions] = useState<Companion[]>(() =>
    data.guests
      .filter((g) => g.is_companion)
      .map((g) => ({ name: g.name, age_group: g.age_group, dietary_restrictions: g.dietary_restrictions ?? "" })),
  );
  const [message, setMessage] = useState(data.group.rsvp_message ?? "");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const anyAttending = Object.values(answers).some((a) => a.attending);
  const allAnswered = Object.values(answers).every((a) => a.attending !== null);

  function setAnswer(id: string, patch: Partial<Answer>) {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allAnswered) return setError("Responda para cada pessoa do convite.");
    if (!consent) return setError("Para continuar, aceite a política de privacidade.");
    start(async () => {
      const res = await submitRsvp({
        slug,
        token,
        guests: Object.entries(answers).map(([id, a]) => ({
          id,
          attending: Boolean(a.attending),
          dietary_restrictions: a.dietary_restrictions,
        })),
        companions: anyAttending ? companions.slice(0, max) : [],
        message,
        consent,
      });
      if (res.error || !res.data) return setError(res.error ?? "Erro inesperado.");
      setData(res.data);
      setEditing(false);
    });
  }

  if (data.event.deadline_passed && data.group.rsvp_status === "pendente") {
    return (
      <p className="text-center text-muted">
        O prazo para confirmar presença terminou em {formatDate(data.event.rsvp_deadline)}. Fale diretamente com os anfitriões.
      </p>
    );
  }

  if (!editing) {
    const going = data.guests.filter((g) => g.rsvp_status === "confirmado");
    return (
      <div className="text-center">
        <p className="font-script text-4xl" style={{ color: "var(--accent)" }}>
          {data.group.rsvp_status === "confirmado" ? "Obrigado!" : "Sentiremos sua falta"}
        </p>
        <p className="mt-2 text-muted">
          {data.group.rsvp_status === "confirmado"
            ? `Presença confirmada para ${going.length} pessoa(s): ${going.map((g) => g.name).join(", ")}.`
            : "Recebemos sua resposta. Obrigado por nos avisar!"}
        </p>
        {!data.event.deadline_passed && (
          <button onClick={() => setEditing(true)} className="mt-6 text-sm font-semibold underline" style={{ color: "var(--accent)" }}>
            Alterar resposta
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h2 className="text-center text-3xl">Confirme sua presença</h2>
        {data.event.rsvp_deadline && (
          <p className="mt-1 text-center text-sm text-muted">Responda até {formatDate(data.event.rsvp_deadline)}</p>
        )}
      </div>

      <ul className="space-y-4">
        {invited.map((g) => {
          const a = answers[g.id];
          return (
            <li key={g.id} className="rounded-xl border border-line bg-white p-4">
              <p className="font-title text-xl">{g.name}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAnswer(g.id, { attending: true })}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${a.attending === true ? "border-transparent text-white" : "border-line text-ink"}`}
                  style={a.attending === true ? accent : undefined}
                >
                  Vou com certeza
                </button>
                <button
                  type="button"
                  onClick={() => setAnswer(g.id, { attending: false })}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${a.attending === false ? "border-stone-500 bg-stone-500 text-white" : "border-line text-ink"}`}
                >
                  Não poderei ir
                </button>
              </div>
              {a.attending && (
                <input
                  className="input mt-3"
                  placeholder="Restrição alimentar ou alergia (opcional)"
                  value={a.dietary_restrictions}
                  onChange={(e) => setAnswer(g.id, { dietary_restrictions: e.target.value })}
                  maxLength={500}
                />
              )}
            </li>
          );
        })}
      </ul>

      {max > 0 && anyAttending && (
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="font-title text-xl">Acompanhantes</p>
          <p className="text-sm text-muted">Este convite permite até {max} acompanhante(s).</p>
          <div className="mt-3 space-y-3">
            {companions.map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <input
                  className="input"
                  placeholder="Nome completo"
                  value={c.name}
                  maxLength={200}
                  onChange={(e) => setCompanions((l) => l.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                />
                <select
                  className="input"
                  value={c.age_group}
                  onChange={(e) => setCompanions((l) => l.map((x, idx) => (idx === i ? { ...x, age_group: e.target.value as AgeGroup } : x)))}
                >
                  {Object.entries(AGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input
                  className="input sm:col-span-2"
                  placeholder="Restrição alimentar (opcional)"
                  value={c.dietary_restrictions}
                  maxLength={500}
                  onChange={(e) => setCompanions((l) => l.map((x, idx) => (idx === i ? { ...x, dietary_restrictions: e.target.value } : x)))}
                />
                <button type="button" className="justify-self-start text-xs text-red-700 underline" onClick={() => setCompanions((l) => l.filter((_, idx) => idx !== i))}>
                  Remover acompanhante
                </button>
              </div>
            ))}
            {companions.length < max && (
              <button
                type="button"
                className="text-sm font-semibold underline"
                style={{ color: "var(--accent)" }}
                onClick={() => setCompanions((l) => [...l, { name: "", age_group: "adulto", dietary_restrictions: "" }])}
              >
                + Adicionar acompanhante
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="rsvp-message">Deixe um recado (opcional)</label>
        <textarea id="rsvp-message" className="input" rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>
          Autorizo o uso destes dados exclusivamente para a organização do evento, conforme a{" "}
          <Link href="/politica-de-privacidade" target="_blank" className="underline">política de privacidade</Link>.
        </span>
      </label>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        className="w-full rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        style={accent}
        disabled={pending}
      >
        {pending ? "Enviando..." : "Enviar resposta"}
      </button>
    </form>
  );
}
