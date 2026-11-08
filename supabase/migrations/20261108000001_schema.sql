-- =============================================================================
-- ArtBrown Company — esquema principal
-- Todas as tabelas têm RLS habilitado. Acesso público (convidados sem login)
-- acontece somente por funções SECURITY DEFINER (ver migration de RSVP).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'cerimonialista', 'cliente', 'portaria');
create type public.event_type as enum ('casamento', 'aniversario', 'debutante', 'corporativo', 'bodas', 'outro');
create type public.event_status as enum ('planejamento', 'confirmado', 'realizado', 'cancelado');
create type public.photo_moderation as enum ('auto', 'manual');
create type public.rsvp_status as enum ('pendente', 'confirmado', 'recusado');
create type public.guest_side as enum ('noivo', 'noiva', 'ambos');
create type public.guest_age_group as enum ('adulto', 'crianca', 'bebe');
create type public.lead_status as enum ('novo', 'em_contato', 'proposta', 'fechado', 'perdido');
create type public.photo_status as enum ('pendente', 'aprovada', 'rejeitada');
create type public.gallery_kind as enum ('inspiracao', 'evento');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.random_token(len int default 10)
returns text language sql volatile as $$
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', (get_byte(b, i) % 31) + 1, 1), '')
  from extensions.gen_random_bytes(len) b, generate_series(0, len - 1) i
$$;

create or replace function public.slugify(value text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  role public.user_role not null default 'cliente',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- O papel vem de app_metadata (só pode ser definido com a service role),
-- nunca de user_metadata (que o próprio usuário controla).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'cliente')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Clientes e eventos
-- -----------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  document text,                       -- CPF/CNPJ
  notes text,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_user_id_idx on public.clients (user_id);
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  type public.event_type not null default 'casamento',
  status public.event_status not null default 'planejamento',
  title text not null,
  slug text not null unique,
  partner1_name text,
  partner2_name text,
  event_date date,
  ceremony_time time,
  ceremony_location text,
  ceremony_address text,
  party_location text,
  party_address text,
  theme text,
  guest_limit integer check (guest_limit is null or guest_limit >= 0),
  rsvp_deadline date,
  -- Personalização da página de RSVP
  rsvp_title text,
  rsvp_message text,
  rsvp_cover_path text,
  rsvp_primary_color text not null default '#A98F71',
  rsvp_background_color text not null default '#FBF8F3',
  whatsapp_template text,
  photo_moderation public.photo_moderation not null default 'manual',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_client_id_idx on public.events (client_id);
create index events_date_idx on public.events (event_date);
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- Cerimonialistas e equipe de portaria atribuídos a um evento
create table public.event_staff (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_staff_user_idx on public.event_staff (user_id);

-- -----------------------------------------------------------------------------
-- Funções de autorização (SECURITY DEFINER para evitar recursão de RLS)
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_event_client(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events e join public.clients c on c.id = e.client_id
    where e.id = p_event_id and c.user_id = auth.uid()
  )
$$;

create or replace function public.is_event_staff(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_staff s join public.profiles p on p.id = s.user_id
    where s.event_id = p_event_id and s.user_id = auth.uid() and p.active
  )
$$;

-- Pode ver o evento (admin, equipe atribuída, cliente dono)
create or replace function public.can_view_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_event_staff(p_event_id) or public.is_event_client(p_event_id)
$$;

-- Pode editar dados do evento (admin, cerimonialista atribuído, cliente dono)
create or replace function public.can_manage_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or public.is_event_client(p_event_id)
      or (public.current_user_role() = 'cerimonialista' and public.is_event_staff(p_event_id))
$$;

-- Portaria: equipe atribuída (cerimonialista ou portaria) e admin
create or replace function public.can_door(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_event_staff(p_event_id)
$$;

-- Clientes podem editar dados e personalização do evento, mas não campos
-- contratuais (cliente, slug, limite de convidados, status).
create or replace function public.protect_event_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.client_id is distinct from old.client_id
     or new.slug is distinct from old.slug
     or new.guest_limit is distinct from old.guest_limit
     or new.created_by is distinct from old.created_by then
    raise exception 'Somente a administração pode alterar este campo do evento.' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and public.current_user_role() <> 'cerimonialista' then
    raise exception 'Somente a equipe pode alterar o status do evento.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger events_protect_columns before update on public.events
  for each row execute function public.protect_event_columns();

-- -----------------------------------------------------------------------------
-- Convidados
-- guest_groups = um convite (família/grupo) com link único de RSVP
-- -----------------------------------------------------------------------------
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  number integer,
  capacity integer not null default 8 check (capacity > 0),
  qr_token text not null unique default public.random_token(12),
  pos_x numeric,
  pos_y numeric,
  created_at timestamptz not null default now()
);
create index tables_event_idx on public.tables (event_id);

create table public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  side public.guest_side not null default 'ambos',
  phone text,
  invite_token text not null unique default public.random_token(10),
  max_companions integer not null default 0 check (max_companions >= 0),
  rsvp_status public.rsvp_status not null default 'pendente',
  responded_at timestamptz,
  rsvp_message text,
  consent_at timestamptz,
  invite_sent_at timestamptz,
  reminder_sent_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guest_groups_event_idx on public.guest_groups (event_id);
create trigger guest_groups_updated_at before update on public.guest_groups
  for each row execute function public.set_updated_at();

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  group_id uuid not null references public.guest_groups (id) on delete cascade,
  name text not null,
  age_group public.guest_age_group not null default 'adulto',
  is_companion boolean not null default false,      -- acompanhante adicionado no RSVP
  side public.guest_side not null default 'ambos',
  phone text,
  email text,
  dietary_restrictions text,
  rsvp_status public.rsvp_status not null default 'pendente',
  table_id uuid references public.tables (id) on delete set null,
  added_at_door boolean not null default false,     -- convidado de última hora
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guests_event_idx on public.guests (event_id);
create index guests_group_idx on public.guests (group_id);
create index guests_table_idx on public.guests (table_id);
create trigger guests_updated_at before update on public.guests
  for each row execute function public.set_updated_at();

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  guest_id uuid not null unique references public.guests (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references public.profiles (id) on delete set null,
  device text
);
create index checkins_event_idx on public.checkins (event_id);

-- -----------------------------------------------------------------------------
-- Lista de presentes
-- -----------------------------------------------------------------------------
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  description text,
  image_path text,
  reference_price numeric(12, 2),
  store_url text,
  quantity integer not null default 1 check (quantity > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index gifts_event_idx on public.gifts (event_id);

create table public.gift_reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  group_id uuid references public.guest_groups (id) on delete set null,
  reserved_by_name text not null,
  message text,
  created_at timestamptz not null default now()
);
create index gift_reservations_gift_idx on public.gift_reservations (gift_id);

-- -----------------------------------------------------------------------------
-- Fotos ao vivo (telão) e galeria
-- -----------------------------------------------------------------------------
create table public.live_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  table_id uuid references public.tables (id) on delete set null,
  storage_path text not null,
  author_name text,
  message text,
  status public.photo_status not null default 'pendente',
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index live_photos_event_idx on public.live_photos (event_id, status, created_at desc);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  kind public.gallery_kind not null default 'inspiracao',
  storage_path text not null,
  caption text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index gallery_images_event_idx on public.gallery_images (event_id);

-- -----------------------------------------------------------------------------
-- Fornecedores, cronograma, checklist, documentos
-- -----------------------------------------------------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_name text,
  phone text,
  email text,
  instagram text,
  is_partner boolean not null default true,   -- parceiro da ArtBrown
  notes text,
  created_at timestamptz not null default now()
);

create table public.event_vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  name text not null,           -- cópia/nome livre (fornecedor do próprio cliente)
  category text,
  contact text,
  arrival_time time,
  notes text,
  created_at timestamptz not null default now()
);
create index event_vendors_event_idx on public.event_vendors (event_id);

create table public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  starts_at time not null,
  title text not null,
  description text,
  responsible text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index timeline_items_event_idx on public.timeline_items (event_id);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  category text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index checklist_items_event_idx on public.checklist_items (event_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index documents_event_idx on public.documents (event_id);

-- -----------------------------------------------------------------------------
-- Leads (formulário de orçamento do site)
-- -----------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  event_type public.event_type not null default 'casamento',
  event_date date,
  guest_estimate integer check (guest_estimate is null or guest_estimate between 0 and 100000),
  location text check (location is null or char_length(location) <= 300),
  message text check (message is null or char_length(message) <= 4000),
  consent boolean not null default false,
  status public.lead_status not null default 'novo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auditoria
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null,
  record_id text,
  event_id uuid,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_event_idx on public.audit_logs (event_id);

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
begin
  insert into public.audit_logs (table_name, action, record_id, event_id, user_id, old_data, new_data)
  values (
    tg_table_name,
    tg_op,
    v_row ->> 'id',
    case when tg_table_name = 'events' then (v_row ->> 'id')::uuid else (v_row ->> 'event_id')::uuid end,
    auth.uid(),
    v_old,
    v_new
  );
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients', 'events', 'event_staff', 'guest_groups', 'guests', 'tables',
                           'checkins', 'gifts', 'gift_reservations', 'documents', 'leads', 'profiles']
  loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I
                    for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.event_staff enable row level security;
alter table public.tables enable row level security;
alter table public.guest_groups enable row level security;
alter table public.guests enable row level security;
alter table public.checkins enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_reservations enable row level security;
alter table public.live_photos enable row level security;
alter table public.gallery_images enable row level security;
alter table public.vendors enable row level security;
alter table public.event_vendors enable row level security;
alter table public.timeline_items enable row level security;
alter table public.checklist_items enable row level security;
alter table public.documents enable row level security;
alter table public.leads enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: cada um vê o seu; admin vê e edita todos; equipe/cliente veem perfis
-- de quem está no mesmo evento (para mostrar o nome do cerimonialista etc.)
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin()
  or exists (
    select 1 from public.event_staff s
    where s.user_id = profiles.id and public.can_view_event(s.event_id)
  )
);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_user_role() and active);
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- clients
create policy clients_select on public.clients for select to authenticated using (
  public.is_admin() or user_id = auth.uid()
  or exists (select 1 from public.events e where e.client_id = clients.id and public.is_event_staff(e.id))
);
create policy clients_admin_write on public.clients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- events
create policy events_select on public.events for select to authenticated
  using (public.can_view_event(id));
create policy events_insert on public.events for insert to authenticated
  with check (public.is_admin());
create policy events_update on public.events for update to authenticated
  using (public.can_manage_event(id)) with check (public.can_manage_event(id));
create policy events_delete on public.events for delete to authenticated
  using (public.is_admin());

-- event_staff
create policy event_staff_select on public.event_staff for select to authenticated
  using (public.can_view_event(event_id));
create policy event_staff_admin on public.event_staff for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Tabelas "do evento" que quem gerencia o evento pode editar
do $$
declare t text;
begin
  foreach t in array array['tables', 'guest_groups', 'gifts', 'gallery_images', 'event_vendors',
                           'timeline_items', 'checklist_items', 'documents']
  loop
    execute format('create policy %I_select on public.%I for select to authenticated
                    using (public.can_view_event(event_id))', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated
                    using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id))', t, t);
  end loop;
end $$;

-- guests: gestores editam; portaria pode incluir convidado de última hora
create policy guests_select on public.guests for select to authenticated
  using (public.can_view_event(event_id));
create policy guests_write on public.guests for all to authenticated
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy guests_door_insert on public.guests for insert to authenticated
  with check (public.can_door(event_id) and added_at_door);

-- checkins: portaria/equipe/admin
create policy checkins_select on public.checkins for select to authenticated
  using (public.can_view_event(event_id));
create policy checkins_door on public.checkins for all to authenticated
  using (public.can_door(event_id)) with check (public.can_door(event_id));

-- gift_reservations: noivos/gestores veem e podem remover; inserção pública via RPC
create policy gift_reservations_select on public.gift_reservations for select to authenticated
  using (public.can_view_event(event_id));
create policy gift_reservations_manage on public.gift_reservations for delete to authenticated
  using (public.can_manage_event(event_id));

-- live_photos: equipe/clientes veem e moderam; envio público via RPC
create policy live_photos_select on public.live_photos for select to authenticated
  using (public.can_view_event(event_id));
create policy live_photos_moderate on public.live_photos for update to authenticated
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy live_photos_delete on public.live_photos for delete to authenticated
  using (public.can_manage_event(event_id));

-- vendors (cadastro de parceiros): todos autenticados leem, admin edita
create policy vendors_select on public.vendors for select to authenticated using (true);
create policy vendors_admin on public.vendors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- leads: qualquer visitante pode criar (formulário do site); só admin lê/edita
create policy leads_public_insert on public.leads for insert to anon, authenticated
  with check (status = 'novo' and notes is null and consent);
create policy leads_admin on public.leads for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- audit_logs: somente admin lê; ninguém escreve diretamente (só o trigger)
create policy audit_logs_admin_select on public.audit_logs for select to authenticated
  using (public.is_admin());

-- =============================================================================
-- Realtime (RSVP ao vivo, portaria sincronizada, telão)
-- =============================================================================
alter publication supabase_realtime add table public.guest_groups;
alter publication supabase_realtime add table public.guests;
alter publication supabase_realtime add table public.checkins;
alter publication supabase_realtime add table public.live_photos;

-- =============================================================================
-- Storage
-- Convenção de caminho: <event_id>/<arquivo>
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('gallery', 'gallery', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('live-photos', 'live-photos', false, 5242880, array['image/jpeg', 'image/webp']),
  ('documents', 'documents', false, 20971520, null),
  ('gifts', 'gifts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('public-assets', 'public-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.storage_event_id(p_name text)
returns uuid language plpgsql immutable as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end $$;

create policy storage_event_read on storage.objects for select to authenticated using (
  bucket_id in ('gallery', 'live-photos', 'documents', 'gifts', 'public-assets')
  and public.can_view_event(public.storage_event_id(name))
);
create policy storage_event_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('gallery', 'documents', 'gifts', 'public-assets')
  and public.can_manage_event(public.storage_event_id(name))
);
create policy storage_event_update on storage.objects for update to authenticated using (
  bucket_id in ('gallery', 'documents', 'gifts', 'public-assets')
  and public.can_manage_event(public.storage_event_id(name))
);
create policy storage_event_delete on storage.objects for delete to authenticated using (
  bucket_id in ('gallery', 'live-photos', 'documents', 'gifts', 'public-assets')
  and public.can_manage_event(public.storage_event_id(name))
);
