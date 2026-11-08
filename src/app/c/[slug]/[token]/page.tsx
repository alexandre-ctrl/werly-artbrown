import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatWeekday, publicStorageUrl } from "@/lib/format";
import type { RsvpData } from "@/lib/types";
import { RsvpForm } from "./rsvp-form";

const load = cache(async (slug: string, token: string) => {
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("rsvp_get", { p_slug: slug, p_token: token });
  return (data as RsvpData | null) ?? null;
});

export async function generateMetadata({ params }: PageProps<"/c/[slug]/[token]">): Promise<Metadata> {
  const { slug, token } = await params;
  const data = await load(slug, token);
  return {
    title: data ? data.event.title : "Convite",
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: PageProps<"/c/[slug]/[token]">) {
  const { slug, token } = await params;
  const data = await load(slug, token);
  if (!data) notFound();
  const { event } = data;
  const cover = publicStorageUrl("public-assets", event.rsvp_cover_path);
  const names =
    event.partner1_name && event.partner2_name ? `${event.partner1_name} & ${event.partner2_name}` : event.title;

  return (
    <main
      className="flex-1"
      style={{ background: event.rsvp_background_color, ["--accent" as string]: event.rsvp_primary_color }}
    >
      {cover && (
        <div className="relative h-64 sm:h-96">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>
      )}

      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="font-script text-3xl" style={{ color: "var(--accent)" }}>
          {event.rsvp_title || "Você é nosso convidado"}
        </p>
        <h1 className="mt-3 text-5xl leading-tight sm:text-6xl">{names}</h1>
        {event.event_date && (
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
            {formatWeekday(event.event_date)} · {formatDate(event.event_date)}
            {event.ceremony_time && ` · ${formatTime(event.ceremony_time)}`}
          </p>
        )}

        <div className="mx-auto my-8 h-px w-16" style={{ background: "var(--accent)" }} />

        <p className="font-title text-2xl">Olá, {data.group.name}!</p>
        {event.rsvp_message && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{event.rsvp_message}</p>}

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          {event.ceremony_location && (
            <Place title="Cerimônia" name={event.ceremony_location} address={event.ceremony_address} />
          )}
          {event.party_location && <Place title="Recepção" name={event.party_location} address={event.party_address} />}
        </div>

        <div className="mt-10 rounded-2xl bg-white/80 p-6 text-left shadow-sm ring-1 ring-black/5">
          <RsvpForm slug={slug} token={token} initial={data} />
        </div>
      </div>

      <footer className="pb-10 text-center text-xs text-muted">
        <span className="block">Organização</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ArtBrown Company" className="mx-auto mt-2 h-10 w-auto opacity-80" />
      </footer>
    </main>
  );
}

function Place({ title, name, address }: { title: string; name: string; address: string | null }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address ?? ""}`)}`;
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{title}</p>
      <p className="mt-1 font-title text-xl">{name}</p>
      {address && <p className="text-sm text-muted">{address}</p>}
      <a href={maps} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold underline" style={{ color: "var(--accent)" }}>
        Ver no mapa
      </a>
    </div>
  );
}
