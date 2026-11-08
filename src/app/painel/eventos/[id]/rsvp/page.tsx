import { getEvent } from "@/lib/events";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildInviteMessage, rsvpLink } from "@/lib/rsvp";
import type { Guest, GuestGroup } from "@/lib/types";
import { RsvpBoard, type BoardGroup } from "./rsvp-board";

export default async function RsvpPage({ params }: PageProps<"/painel/eventos/[id]/rsvp">) {
  const { id } = await params;
  const [event, profile] = await Promise.all([getEvent(id), requireProfile()]);
  const supabase = await createClient();
  const [{ data: groups }, { data: guests }] = await Promise.all([
    supabase.from("guest_groups").select("*").eq("event_id", id).order("name"),
    supabase.from("guests").select("id, group_id, name, rsvp_status, is_companion, age_group, dietary_restrictions").eq("event_id", id),
  ]);

  const members = new Map<string, Pick<Guest, "name" | "rsvp_status" | "is_companion" | "age_group" | "dietary_restrictions">[]>();
  for (const g of (guests ?? []) as Guest[]) members.set(g.group_id, [...(members.get(g.group_id) ?? []), g]);

  const board: BoardGroup[] = ((groups ?? []) as GuestGroup[]).map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    rsvp_status: g.rsvp_status,
    responded_at: g.responded_at,
    invite_sent_at: g.invite_sent_at,
    reminder_sent_at: g.reminder_sent_at,
    rsvp_message: g.rsvp_message,
    link: rsvpLink(event.slug, g.invite_token),
    inviteMessage: buildInviteMessage(event, g, "convite"),
    reminderMessage: buildInviteMessage(event, g, "lembrete"),
    members: members.get(g.id) ?? [],
  }));

  return <RsvpBoard eventId={event.id} groups={board} canSend={profile.role !== "portaria"} deadline={event.rsvp_deadline} />;
}
