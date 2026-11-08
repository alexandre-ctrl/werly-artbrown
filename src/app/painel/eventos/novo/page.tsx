import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Field, Select } from "@/components/fields";
import { createEventAction } from "../actions";
import { EventFields } from "../event-fields";

export default async function NewEventPage({ searchParams }: PageProps<"/painel/eventos/novo">) {
  await requireProfile(["admin"]);
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");

  if (!clients?.length) {
    return (
      <>
        <PageHeader title="Novo evento" />
        <div className="card">
          <p className="text-sm text-muted">Cadastre primeiro o cliente responsável pelo evento.</p>
          <Link href="/painel/clientes/novo" className="btn btn-primary mt-4">Cadastrar cliente</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Novo evento" />
      <div className="card max-w-3xl">
        <ActionForm action={createEventAction} submitLabel="Criar evento" className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Cliente *"
            name="client_id"
            className="sm:col-span-2"
            defaultValue={typeof cliente === "string" ? cliente : ""}
            options={[["", "Selecione..."], ...clients.map((c) => [c.id, c.name] as [string, string])]}
            required
          />
          <EventFields />
          <Field label="Limite de convidados (contratado)" name="guest_limit" type="number" min={0} />
          <Select
            label="Moderação das fotos do telão"
            name="photo_moderation"
            options={{ manual: "Manual (aprovar antes)", auto: "Automática (direto ao telão)" }}
            defaultValue="manual"
            hint="Pode ser alterada depois."
          />
        </ActionForm>
      </div>
    </>
  );
}
