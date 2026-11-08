import { getEvent } from "@/lib/events";
import { requireProfile } from "@/lib/auth";
import { formatDate, daysUntil } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/labels";
import { EventTabs } from "./event-tabs";

export default async function EventLayout({ children, params }: LayoutProps<"/painel/eventos/[id]">) {
  const { id } = await params;
  const [event, profile] = await Promise.all([getEvent(id), requireProfile()]);
  const days = daysUntil(event.event_date);

  const tabs = [
    { href: `/painel/eventos/${id}`, label: "Visão geral", exact: true },
    { href: `/painel/eventos/${id}/convidados`, label: "Convidados" },
    { href: `/painel/eventos/${id}/rsvp`, label: "Confirmações" },
  ];
  if (profile.role !== "portaria") {
    tabs.push({ href: `/painel/eventos/${id}/personalizar`, label: "Página do convite" });
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">
          {EVENT_TYPE_LABEL[event.type]} · {formatDate(event.event_date)}
          {days !== null && days >= 0 && ` · faltam ${days} dias`}
        </p>
        <h1 className="text-3xl sm:text-4xl">{event.title}</h1>
      </div>
      <EventTabs tabs={tabs} />
      <div className="mt-6">{children}</div>
    </>
  );
}
