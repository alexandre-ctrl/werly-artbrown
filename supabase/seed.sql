-- =============================================================================
-- Dados de exemplo (somente desenvolvimento local: `npx supabase db reset`)
-- Senha de todos os usuários: artbrown123
-- =============================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated',
   'admin@artbrown.com.br', extensions.crypt('artbrown123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"role":"admin"}', '{"full_name":"Administração ArtBrown"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated',
   'cerimonial@artbrown.com.br', extensions.crypt('artbrown123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"role":"cerimonialista"}', '{"full_name":"Helena Martins"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated',
   'noivos@exemplo.com', extensions.crypt('artbrown123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"role":"cliente"}', '{"full_name":"Ana e Pedro"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a4', 'authenticated', 'authenticated',
   'portaria@artbrown.com.br', extensions.crypt('artbrown123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"role":"portaria"}', '{"full_name":"Portaria Tablet 1"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2',
               '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a4');

-- Cliente e evento
insert into public.clients (id, name, email, phone, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'Ana Souza & Pedro Lima', 'noivos@exemplo.com', '+55 11 99999-0000',
   '00000000-0000-0000-0000-0000000000a3');

insert into public.events (
  id, client_id, type, status, title, slug, partner1_name, partner2_name, event_date, ceremony_time,
  ceremony_location, ceremony_address, party_location, party_address, theme, guest_limit, rsvp_deadline,
  rsvp_title, rsvp_message, photo_moderation
) values (
  '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'casamento', 'confirmado',
  'Casamento Ana & Pedro', 'ana-e-pedro', 'Ana', 'Pedro', (current_date + 90), '16:30',
  'Capela Nossa Senhora do Brasil', 'Praça N. Sra. do Brasil, 1 — São Paulo/SP',
  'Espaço Villa Jardim', 'Rua das Flores, 200 — São Paulo/SP',
  'Jardim romântico em tons de areia e dourado', 150, (current_date + 60),
  'Vamos celebrar juntos!', 'Será uma alegria imensa ter você conosco neste dia tão especial. Confirme sua presença até a data indicada.',
  'manual'
);

insert into public.event_staff (event_id, user_id) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a4');

insert into public.tables (id, event_id, name, number, capacity) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Mesa dos Noivos', 1, 10),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Família da Noiva', 2, 8),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Família do Noivo', 3, 8);

insert into public.guest_groups (id, event_id, name, side, phone, invite_token, max_companions, rsvp_status, responded_at, consent_at) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Família Souza', 'noiva', '+5511988880001', 'souza2026', 1, 'confirmado', now(), now()),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Família Lima', 'noivo', '+5511988880002', 'lima2026', 0, 'pendente', null, null),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Juliana Prado', 'ambos', '+5511988880003', 'juliana26', 1, 'pendente', null, null);

insert into public.guests (event_id, group_id, name, age_group, side, rsvp_status, table_id, dietary_restrictions) values
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Marta Souza', 'adulto', 'noiva', 'confirmado', '30000000-0000-0000-0000-000000000002', null),
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Carlos Souza', 'adulto', 'noiva', 'confirmado', '30000000-0000-0000-0000-000000000002', 'Sem lactose'),
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Lia Souza', 'crianca', 'noiva', 'confirmado', '30000000-0000-0000-0000-000000000002', null),
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Roberto Lima', 'adulto', 'noivo', 'pendente', '30000000-0000-0000-0000-000000000003', null),
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Sandra Lima', 'adulto', 'noivo', 'pendente', '30000000-0000-0000-0000-000000000003', 'Vegetariana'),
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'Juliana Prado', 'adulto', 'ambos', 'pendente', null, null);

insert into public.vendors (name, category, contact_name, phone, instagram) values
  ('Flor de Lis Decoração', 'Decoração', 'Renata', '+55 11 97777-1000', '@flordelisdecor'),
  ('Sabor & Arte Buffet', 'Buffet', 'Marcos', '+55 11 97777-2000', '@saborearte'),
  ('Luz Eterna Fotografia', 'Fotografia', 'Bianca', '+55 11 97777-3000', '@luzeternafoto');

insert into public.timeline_items (event_id, starts_at, title, responsible, sort_order) values
  ('20000000-0000-0000-0000-000000000001', '14:00', 'Chegada da equipe ArtBrown', 'Helena', 1),
  ('20000000-0000-0000-0000-000000000001', '16:30', 'Cerimônia', 'Helena', 2),
  ('20000000-0000-0000-0000-000000000001', '18:00', 'Recepção e coquetel', 'Buffet', 3),
  ('20000000-0000-0000-0000-000000000001', '20:00', 'Primeira dança', 'DJ', 4);

insert into public.checklist_items (event_id, title, due_date, done, category, sort_order) values
  ('20000000-0000-0000-0000-000000000001', 'Fechar buffet', current_date - 30, true, 'Fornecedores', 1),
  ('20000000-0000-0000-0000-000000000001', 'Enviar convites (RSVP)', current_date + 7, false, 'Convidados', 2),
  ('20000000-0000-0000-0000-000000000001', 'Prova do vestido', current_date + 45, false, 'Noivos', 3);

insert into public.leads (name, email, phone, event_type, event_date, guest_estimate, location, message, consent) values
  ('Camila Rocha', 'camila@exemplo.com', '+55 11 96666-1234', 'casamento', current_date + 300, 180, 'Campinas/SP',
   'Gostaria de um orçamento para assessoria completa.', true);
