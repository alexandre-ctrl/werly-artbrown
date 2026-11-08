"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createLead } from "./actions";
import { EVENT_TYPE_LABEL } from "@/lib/labels";
import { FormMessage } from "@/components/form-message";

export function LeadForm() {
  const [state, action, pending] = useActionState(createLead, null);

  if (state?.ok) {
    return <p className="py-8 text-center font-title text-2xl text-gold-700">{state.message}</p>;
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Nome *</label>
        <input id="name" name="name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="phone">WhatsApp</label>
        <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" placeholder="(11) 99999-9999" />
      </div>
      <div>
        <label className="label" htmlFor="event_type">Tipo de evento</label>
        <select id="event_type" name="event_type" className="input" defaultValue="casamento">
          {Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="event_date">Data prevista</label>
        <input id="event_date" name="event_date" type="date" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="guest_estimate">Nº de convidados</label>
        <input id="guest_estimate" name="guest_estimate" type="number" min={0} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="location">Cidade / local</label>
        <input id="location" name="location" className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="message">Conte sobre o seu sonho</label>
        <textarea id="message" name="message" rows={4} className="input" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-2 text-sm text-muted sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1 accent-gold" />
        <span>
          Autorizo o uso dos meus dados para contato sobre o orçamento, conforme a{" "}
          <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
        </span>
      </label>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
        <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? "Enviando..." : "Enviar pedido de orçamento"}
        </button>
      </div>
    </form>
  );
}
