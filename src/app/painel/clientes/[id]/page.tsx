import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EVENT_STATUS_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Field, TextArea } from "@/components/fields";
import { grantClientAccessAction, updateClientAction } from "../actions";
import type { Client, EventRow } from "@/lib/types";

export default async function ClientPage({ params }: PageProps<"/painel/clientes/[id]">) {
  await requireProfile(["admin"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const client = data as Client;
  const { data: events } = await supabase.from("events").select("*").eq("client_id", id).order("event_date");

  return (
    <>
      <PageHeader
        title={client.name}
        subtitle="Cliente"
        actions={<Link href={`/painel/eventos/novo?cliente=${client.id}`} className="btn btn-primary">Novo evento para este cliente</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card">
          <h2 className="mb-4 text-2xl">Dados</h2>
          <ActionForm action={updateClientAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={client.id} />
            <Field label="Nome *" name="name" required defaultValue={client.name} className="sm:col-span-2" />
            <Field label="E-mail" name="email" type="email" defaultValue={client.email ?? ""} />
            <Field label="Telefone" name="phone" defaultValue={client.phone ?? ""} />
            <Field label="CPF / CNPJ" name="document" defaultValue={client.document ?? ""} />
            <TextArea label="Observações" name="notes" defaultValue={client.notes ?? ""} className="sm:col-span-2" />
          </ActionForm>
        </div>
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-2 text-2xl">Acesso</h2>
            <p className="mb-4 text-sm text-muted">
              {client.user_id
                ? `Login ativo com o e-mail ${client.email}. Defina uma nova senha se o cliente esquecer.`
                : "Este cliente ainda não tem login na Área do Cliente."}
            </p>
            <ActionForm action={grantClientAccessAction} submitLabel={client.user_id ? "Redefinir senha" : "Criar acesso"} buttonClassName="btn btn-outline">
              <input type="hidden" name="id" value={client.id} />
              <Field label={client.user_id ? "Nova senha" : "Senha inicial"} name="password" required minLength={8} autoComplete="off" />
            </ActionForm>
          </div>
          <div className="card">
            <h2 className="mb-3 text-2xl">Eventos</h2>
            {!(events as EventRow[] | null)?.length && <p className="text-sm text-muted">Nenhum evento.</p>}
            <ul className="space-y-2">
              {(events as EventRow[] | null)?.map((e) => (
                <li key={e.id}>
                  <Link href={`/painel/eventos/${e.id}`} className="font-semibold text-gold-700 hover:underline">{e.title}</Link>
                  <p className="text-xs text-muted">{formatDate(e.event_date)} · {EVENT_STATUS_LABEL[e.status]}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
