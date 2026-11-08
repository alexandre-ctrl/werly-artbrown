import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatDate, todayISO } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/labels";
import { EmptyState, PageHeader, Stat } from "@/components/page-header";
import type { EventRow } from "@/lib/types";

type Summary = { event_id: string; total_guests: number; confirmed: number; declined: number; pending: number };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", todayISO())
    .neq("status", "cancelado")
    .order("event_date", { ascending: true })
    .limit(20);
  const events = (eventsData ?? []) as EventRow[];

  // Cliente com um único evento vai direto para ele
  if (profile.role === "cliente") {
    const { data: all } = await supabase.from("events").select("id");
    if (all && all.length === 1) redirect(`/painel/eventos/${all[0].id}`);
  }

  const { data: summaries } = await supabase.from("event_rsvp_summary").select("*");
  const byEvent = new Map((summaries as Summary[] | null)?.map((s) => [s.event_id, s]));

  let newLeads = 0;
  let clientsCount = 0;
  if (profile.role === "admin") {
    const [{ count: l }, { count: c }] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
      supabase.from("clients").select("id", { count: "exact", head: true }),
    ]);
    newLeads = l ?? 0;
    clientsCount = c ?? 0;
  }

  const thisMonth = events.filter((e) => (daysUntil(e.event_date) ?? 999) <= 30).length;

  return (
    <>
      <PageHeader
        title={`Olá, ${profile.full_name.split(" ")[0] || "bem-vindo(a)"}`}
        subtitle="Acompanhe os próximos eventos e as confirmações de presença."
        actions={
          profile.role === "admin" && (
            <Link href="/painel/eventos/novo" className="btn btn-primary">Novo evento</Link>
          )
        }
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Próximos eventos" value={events.length} />
        <Stat label="Nos próximos 30 dias" value={thisMonth} />
        {profile.role === "admin" && (
          <>
            <Stat label="Leads novos" value={newLeads} hint={<Link href="/painel/leads" className="underline">Ver leads</Link>} />
            <Stat label="Clientes" value={clientsCount} />
          </>
        )}
      </div>

      <h2 className="mb-4 text-2xl">Próximos eventos</h2>
      {events.length === 0 ? (
        <EmptyState>Nenhum evento futuro.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((e) => {
            const s = byEvent.get(e.id);
            const days = daysUntil(e.event_date);
            const pct = s && s.total_guests ? Math.round((s.confirmed / s.total_guests) * 100) : 0;
            return (
              <Link key={e.id} href={`/painel/eventos/${e.id}`} className="card block transition hover:border-gold-300">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">{EVENT_TYPE_LABEL[e.type]}</p>
                    <h3 className="text-2xl">{e.title}</h3>
                    <p className="text-sm text-muted">{formatDate(e.event_date)}</p>
                  </div>
                  {days !== null && (
                    <span className="badge bg-gold-50 text-gold-700">{days === 0 ? "Hoje" : `${days} dias`}</span>
                  )}
                </div>
                {s && (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-gold-50">
                      <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {s.confirmed} confirmados · {s.pending} pendentes · {s.declined} não irão
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
