# ArtBrown Company — sistema de eventos

Site institucional + painel de gestão de casamentos e eventos da **ArtBrown Company**.
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime, RLS).

## Status das fases

| Fase | Escopo | Situação |
|---|---|---|
| **1 — MVP** | Site, login/papéis, admin de clientes e eventos, convidados, RSVP + link WhatsApp | ✅ implementada |
| 2 | Mesas, portaria (lista no tablet) | banco pronto (`tables`, `checkins`, RLS de portaria) — telas pendentes |
| 3 | QR de mesa + fotos no telão com moderação | banco pronto (`live_photos`, `tables.qr_token`, `events.photo_moderation`, bucket) — telas pendentes |
| 4 | Presentes, galeria, cronograma, checklist, fornecedores, relatórios | banco pronto — telas pendentes |

O banco já contém **todas** as entidades da especificação, para que as próximas fases sejam só telas e funções.

## O que existe na Fase 1

- **Site** (`/`): serviços, portfólio, depoimentos, formulário de orçamento (gera **lead**), botão de WhatsApp, política de privacidade, SEO (metadata, `robots.txt`, `sitemap.xml`). Textos editáveis em `src/content/site.ts`.
- **Login** (`/login`) e **painel** (`/painel`), com menus por papel:
  - **Administrador:** dashboard, eventos, clientes (com criação de login do cliente), leads (funil + responder no WhatsApp), equipe (criar cerimonialistas/portaria, ativar/desativar, redefinir senha).
  - **Cerimonialista:** eventos atribuídos a ele(a).
  - **Cliente:** só o próprio evento (cai direto nele ao entrar).
- **Evento:** dados, status, limite contratado, equipe atribuída, exclusão de dados de convidados (LGPD).
- **Convidados:** convites (família/grupo) com pessoas, crianças/bebês, lado, restrições alimentares, acompanhantes extras; busca e filtros; **importação CSV/Excel** com modelo para baixar. O cliente não ultrapassa o limite contratado (a equipe pode).
- **Confirmações (RSVP):** painel **em tempo real**, filtros “não responderam / não enviados”, e por convite os botões **Copiar mensagem**, **Copiar link** e **Abrir no WhatsApp** (`wa.me`). Depois do primeiro envio vira **lembrete**. Mostra as restrições alimentares dos confirmados.
- **Página do convite:** título, mensagem, cores, foto de capa, prazo e modelo da mensagem de WhatsApp (`{nome} {noivos} {evento} {data} {prazo} {link}`).
- **Convidado** (`/c/<slug>/<token>`, sem login): vê nome, data e locais (com mapa), confirma/recusa por pessoa, informa acompanhantes e restrições, deixa um recado, aceita o consentimento LGPD e pode alterar a resposta até o prazo.

## Segurança

- **RLS em todas as tabelas.** As regras de acesso ficam no banco (`can_view_event`, `can_manage_event`, `can_door`), não só na interface.
- O papel do usuário vem de `app_metadata` (só a service role define) e o usuário não consegue se promover.
- O cliente não altera campos contratuais do evento (limite, slug, cliente, status): um trigger bloqueia.
- Os convidados acessam apenas por funções `SECURITY DEFINER` (`rsvp_get`, `rsvp_submit`), limitadas ao token do convite.
- O cadastro público no Supabase Auth fica **desligado**. Quem cria os acessos é o administrador.
- **Log de auditoria** (`audit_logs`) por trigger nas tabelas principais.

## Rodando localmente

Pré-requisitos: Node 20+, Docker.

```bash
npm install
npx supabase start          # sobe Postgres/Auth/Storage/Realtime e aplica migrations + seed
cp .env.example .env.local  # preencha com as chaves exibidas pelo comando acima
npm run dev
```

Usuários do seed (senha `artbrown123`): `admin@artbrown.com.br`, `cerimonial@artbrown.com.br`,
`noivos@exemplo.com` (cliente), `portaria@artbrown.com.br`. Convite de exemplo:
`http://localhost:3000/c/ana-e-pedro/lima2026`.

Para recriar o banco: `npx supabase db reset`.

## Logo

Copie o arquivo **`logo fundo branco .png`** para **`public/logo.png`**. Enquanto ele não existir, o sistema mostra uma versão tipográfica.

## Produção (Vercel + Supabase)

1. Crie o projeto no Supabase e aplique as migrations: `npx supabase link --project-ref <ref>` e `npx supabase db push` (**não** rode o seed em produção).
2. No Supabase, em Auth → Providers → Email, **desative “Allow new users to sign up”**.
3. Crie o primeiro administrador em Auth → Users → *Add user* e depois rode no SQL Editor:
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'voce@...';`
   `update public.profiles set role = 'admin' where email = 'voce@...';`
4. Na Vercel, configure as variáveis de `.env.example` (`SUPABASE_SERVICE_ROLE_KEY` somente no servidor) e aponte `NEXT_PUBLIC_SITE_URL` para o domínio próprio.
5. ⚠️ O plano **Hobby da Vercel não permite uso comercial**: use o **Pro**. No Supabase Free, fique atento aos limites de banco, storage e conexões Realtime (relevante na Fase 3, telão), e ao pause após inatividade. Para produção, considere o plano Pro, que também traz backups diários.

## Estrutura

```
supabase/migrations/   esquema, RLS, storage, realtime, funções de RSVP
supabase/seed.sql      dados de exemplo
src/app/(site)/        site institucional
src/app/painel/        painel (admin, cerimonialista, cliente)
src/app/c/[slug]/[token]/  página pública de RSVP
src/lib/               supabase, auth, formatação, mensagens de WhatsApp
```
