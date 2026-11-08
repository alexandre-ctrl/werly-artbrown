import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, whatsappLink } from "@/lib/format";
import { EVENT_TYPE_LABEL, LEAD_STATUS_LABEL } from "@/lib/labels";
import { EmptyState, PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Select } from "@/components/fields";
import { WhatsAppIcon } from "@/components/whatsapp-float";
import type { Lead, LeadStatus } from "@/lib/types";
import { deleteLeadAction, updateLeadAction } from "./actions";

export default async function LeadsPage({ searchParams }: PageProps<"/painel/leads">) {
  await requireProfile(["admin"]);
  const { status } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (typeof status === "string" && status in LEAD_STATUS_LABEL) query = query.eq("status", status);
  const { data } = await query;
  const leads = (data ?? []) as Lead[];

  return (
    <>
      <PageHeader title="Leads" subtitle="Pedidos de orçamento recebidos pelo site." />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/painel/leads" className={`btn btn-sm ${!status ? "btn-primary" : "btn-outline"}`}>Todos</Link>
        {(Object.entries(LEAD_STATUS_LABEL) as [LeadStatus, string][]).map(([v, l]) => (
          <Link key={v} href={`/painel/leads?status=${v}`} className={`btn btn-sm ${status === v ? "btn-primary" : "btn-outline"}`}>{l}</Link>
        ))}
      </div>
      {leads.length === 0 ? (
        <EmptyState>Nenhum lead.</EmptyState>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <article key={lead.id} className="card grid gap-4 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl">{lead.name}</h2>
                  <span className="badge bg-gold-50 text-gold-700">{LEAD_STATUS_LABEL[lead.status]}</span>
                </div>
                <p className="text-xs text-muted">Recebido em {formatDateTime(lead.created_at)}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div><dt className="inline text-muted">Evento: </dt><dd className="inline">{EVENT_TYPE_LABEL[lead.event_type]}</dd></div>
                  <div><dt className="inline text-muted">Data: </dt><dd className="inline">{formatDate(lead.event_date)}</dd></div>
                  <div><dt className="inline text-muted">Convidados: </dt><dd className="inline">{lead.guest_estimate ?? "—"}</dd></div>
                  <div><dt className="inline text-muted">Local: </dt><dd className="inline">{lead.location ?? "—"}</dd></div>
                  <div><dt className="inline text-muted">E-mail: </dt><dd className="inline">{lead.email ? <a className="underline" href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</dd></div>
                  <div><dt className="inline text-muted">Telefone: </dt><dd className="inline">{lead.phone ?? "—"}</dd></div>
                </dl>
                {lead.message && <p className="mt-3 whitespace-pre-line rounded-lg bg-ivory p-3 text-sm">{lead.message}</p>}
                {lead.phone && (
                  <a
                    href={whatsappLink(lead.phone, `Olá, ${lead.name.split(" ")[0]}! Aqui é da ArtBrown Company. Recebemos seu pedido de orçamento 💛`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm mt-3 bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                  >
                    <WhatsAppIcon /> Responder no WhatsApp
                  </a>
                )}
              </div>
              <div className="space-y-3">
                <ActionForm action={updateLeadAction} buttonClassName="btn btn-outline btn-sm" className="space-y-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <Select label="Status" name="status" options={LEAD_STATUS_LABEL} defaultValue={lead.status} />
                  <div>
                    <label className="label" htmlFor={`notes-${lead.id}`}>Anotações</label>
                    <textarea id={`notes-${lead.id}`} name="notes" rows={3} className="input" defaultValue={lead.notes ?? ""} />
                  </div>
                </ActionForm>
                <form action={deleteLeadAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <button className="text-xs text-red-700 hover:underline">Excluir lead</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
