-- =============================================================================
-- RSVP público (convidado sem login, acesso pelo token do convite)
-- O token é o segredo: as funções só retornam/alteram dados daquele convite.
-- =============================================================================

create or replace function public.rsvp_get(p_slug text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_group public.guest_groups;
  v_event public.events;
begin
  select g.* into v_group
  from public.guest_groups g join public.events e on e.id = g.event_id
  where g.invite_token = p_token and e.slug = p_slug;

  if not found then
    return null;
  end if;

  select * into v_event from public.events where id = v_group.event_id;

  return jsonb_build_object(
    'event', jsonb_build_object(
      'type', v_event.type,
      'title', v_event.title,
      'partner1_name', v_event.partner1_name,
      'partner2_name', v_event.partner2_name,
      'event_date', v_event.event_date,
      'ceremony_time', v_event.ceremony_time,
      'ceremony_location', v_event.ceremony_location,
      'ceremony_address', v_event.ceremony_address,
      'party_location', v_event.party_location,
      'party_address', v_event.party_address,
      'theme', v_event.theme,
      'rsvp_title', v_event.rsvp_title,
      'rsvp_message', v_event.rsvp_message,
      'rsvp_cover_path', v_event.rsvp_cover_path,
      'rsvp_primary_color', v_event.rsvp_primary_color,
      'rsvp_background_color', v_event.rsvp_background_color,
      'rsvp_deadline', v_event.rsvp_deadline,
      'deadline_passed', v_event.rsvp_deadline is not null
        and v_event.rsvp_deadline < (now() at time zone 'America/Sao_Paulo')::date
    ),
    'group', jsonb_build_object(
      'name', v_group.name,
      'max_companions', v_group.max_companions,
      'rsvp_status', v_group.rsvp_status,
      'responded_at', v_group.responded_at,
      'rsvp_message', v_group.rsvp_message
    ),
    'guests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'age_group', g.age_group,
        'is_companion', g.is_companion,
        'rsvp_status', g.rsvp_status,
        'dietary_restrictions', g.dietary_restrictions
      ) order by g.is_companion, g.created_at)
      from public.guests g where g.group_id = v_group.id
    ), '[]'::jsonb)
  );
end $$;

-- p_guests:     [{ "id": uuid, "attending": bool, "dietary_restrictions": text }]
-- p_companions: [{ "name": text, "age_group": "adulto"|"crianca"|"bebe", "dietary_restrictions": text }]
create or replace function public.rsvp_submit(
  p_slug text,
  p_token text,
  p_guests jsonb,
  p_companions jsonb,
  p_message text,
  p_consent boolean
)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_group public.guest_groups;
  v_event public.events;
  v_item jsonb;
  v_any_attending boolean := false;
  v_companion_count int := 0;
begin
  if not coalesce(p_consent, false) then
    raise exception 'CONSENT_REQUIRED' using errcode = 'P0001';
  end if;

  select g.* into v_group
  from public.guest_groups g join public.events e on e.id = g.event_id
  where g.invite_token = p_token and e.slug = p_slug
  for update of g;

  if not found then
    raise exception 'INVITE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_event from public.events where id = v_group.event_id;

  if v_event.rsvp_deadline is not null
     and v_event.rsvp_deadline < (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'DEADLINE_PASSED' using errcode = 'P0001';
  end if;

  -- Convidados do convite (não acompanhantes)
  for v_item in select * from jsonb_array_elements(coalesce(p_guests, '[]'::jsonb)) loop
    update public.guests
       set rsvp_status = case when (v_item ->> 'attending')::boolean then 'confirmado' else 'recusado' end::public.rsvp_status,
           dietary_restrictions = nullif(left(trim(coalesce(v_item ->> 'dietary_restrictions', '')), 500), '')
     where id = (v_item ->> 'id')::uuid
       and group_id = v_group.id
       and not is_companion;
    if found and (v_item ->> 'attending')::boolean then
      v_any_attending := true;
    end if;
  end loop;

  -- Acompanhantes: substitui os informados anteriormente
  delete from public.guests where group_id = v_group.id and is_companion;

  if v_any_attending then
    for v_item in select * from jsonb_array_elements(coalesce(p_companions, '[]'::jsonb)) loop
      exit when v_companion_count >= v_group.max_companions;
      continue when nullif(trim(coalesce(v_item ->> 'name', '')), '') is null;
      insert into public.guests (event_id, group_id, name, age_group, is_companion, side, rsvp_status, dietary_restrictions)
      values (
        v_group.event_id,
        v_group.id,
        left(trim(v_item ->> 'name'), 200),
        coalesce(nullif(v_item ->> 'age_group', ''), 'adulto')::public.guest_age_group,
        true,
        v_group.side,
        'confirmado',
        nullif(left(trim(coalesce(v_item ->> 'dietary_restrictions', '')), 500), '')
      );
      v_companion_count := v_companion_count + 1;
    end loop;
  end if;

  update public.guest_groups
     set rsvp_status = case when v_any_attending then 'confirmado' else 'recusado' end::public.rsvp_status,
         responded_at = now(),
         rsvp_message = nullif(left(trim(coalesce(p_message, '')), 1000), ''),
         consent_at = now()
   where id = v_group.id;

  return public.rsvp_get(p_slug, p_token);
end $$;

revoke all on function public.rsvp_get(text, text) from public;
revoke all on function public.rsvp_submit(text, text, jsonb, jsonb, text, boolean) from public;
grant execute on function public.rsvp_get(text, text) to anon, authenticated;
grant execute on function public.rsvp_submit(text, text, jsonb, jsonb, text, boolean) to anon, authenticated;

-- Resumo de RSVP para os painéis
create or replace view public.event_rsvp_summary
with (security_invoker = true) as
select
  e.id as event_id,
  count(g.id) filter (where not g.added_at_door) as total_guests,
  count(g.id) filter (where g.rsvp_status = 'confirmado') as confirmed,
  count(g.id) filter (where g.rsvp_status = 'recusado') as declined,
  count(g.id) filter (where g.rsvp_status = 'pendente') as pending,
  count(g.id) filter (where g.rsvp_status = 'confirmado' and g.age_group <> 'adulto') as confirmed_children
from public.events e
left join public.guests g on g.event_id = e.id
group by e.id;
