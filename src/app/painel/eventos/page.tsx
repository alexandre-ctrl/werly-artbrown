import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, todayISO } from "@/lib/format";
import { EVENT_STATUS_LABEL, EVENT_TYPE_LABEL } from "@/lib/labels";
import { EmptyState, PageHeader } from "@/components/page-header";
import type { EventRow } from "@/lib/types";

export default async function EventsPage({ searchParams }: PageProps<"/painel/eventos">) {
  const profile = await requireProfile();
  const { passados } = await searchParams;
  const showPast = passados === "1";
  const supabase = await createClient();
  let query = supabase.from("events").select("*, clients(name)");
  query = showPast
    ? query.lt("event_date", todayISO()).order("event_date", { ascending: false })
    : query.or(`event_date.gte.${todayISO()},event_date.is.null`).order("event_date", { ascending: true, nullsFirst: false });
  const { data } = await query;
  const events = (data ?? []) as (EventRow & { clients: { name: string } | null })[];

  return (
    <>
      <PageHeader
        title={profile.role === "cliente" ? "Meu evento" : "Eventos"}
        actions={
          <>
            <Link href={showPast ? "/painel/eventos" : "/painel/eventos?passados=1"} className="btn btn-outline">
              {showPast ? "Ver próximos" : "Ver realizados"}
            </Link>
            {profile.role === "admin" && <Link href="/painel/eventos/novo" className="btn btn-primary">Novo evento</Link>}
          </>
        }
      />
      {events.length === 0 ? (
        <EmptyState>Nenhum evento {showPast ? "realizado" : "programado"}.</EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr><th>Data</th><th>Evento</th><th>Cliente</th><th>Tipo</th><th>Status</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{formatDate(e.event_date, "short")}</td>
                  <td><Link href={`/painel/eventos/${e.id}`} className="font-semibold text-gold-700 hover:underline">{e.title}</Link></td>
                  <td className="text-muted">{e.clients?.name}</td>
                  <td>{EVENT_TYPE_LABEL[e.type]}</td>
                  <td>{EVENT_STATUS_LABEL[e.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
