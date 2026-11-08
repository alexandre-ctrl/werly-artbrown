import { getEvent } from "@/lib/events";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Guest, GuestGroup } from "@/lib/types";
import { GuestManager } from "./guest-manager";

export default async function GuestsPage({ params }: PageProps<"/painel/eventos/[id]/convidados">) {
  const { id } = await params;
  const [event, profile] = await Promise.all([getEvent(id), requireProfile()]);
  const supabase = await createClient();
  const [{ data: groups }, { data: guests }] = await Promise.all([
    supabase.from("guest_groups").select("*").eq("event_id", id).order("name"),
    supabase.from("guests").select("*").eq("event_id", id).order("is_companion").order("created_at"),
  ]);

  return (
    <GuestManager
      eventId={event.id}
      eventType={event.type}
      guestLimit={event.guest_limit}
      groups={(groups ?? []) as GuestGroup[]}
      guests={(guests ?? []) as Guest[]}
      readOnly={profile.role === "portaria"}
    />
  );
}
