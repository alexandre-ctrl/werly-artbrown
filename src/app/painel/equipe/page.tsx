import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Field, Select } from "@/components/fields";
import type { Profile } from "@/lib/types";
import { createStaffAction, updateStaffAction } from "./actions";

const STAFF_ROLES = { cerimonialista: ROLE_LABEL.cerimonialista, portaria: ROLE_LABEL.portaria, admin: ROLE_LABEL.admin };

export default async function TeamPage() {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").neq("role", "cliente").order("full_name");
  const team = (data ?? []) as Profile[];

  return (
    <>
      <PageHeader title="Equipe" subtitle="Administradores, cerimonialistas e acessos de portaria (tablets)." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {team.map((p) => (
            <article key={p.id} className="card">
              <ActionForm action={updateStaffAction} buttonClassName="btn btn-outline btn-sm" className="grid items-end gap-3 sm:grid-cols-[1fr_160px_120px_160px_auto]">
                <input type="hidden" name="id" value={p.id} />
                <div>
                  <p className="font-semibold">{p.full_name || "—"}</p>
                  <p className="text-xs text-muted">{p.email}</p>
                </div>
                <Select label="Papel" name="role" options={STAFF_ROLES} defaultValue={p.role} />
                <Select label="Situação" name="active" options={{ true: "Ativo", false: "Inativo" }} defaultValue={String(p.active)} />
                <Field label="Nova senha" name="password" placeholder="(manter)" autoComplete="off" />
              </ActionForm>
            </article>
          ))}
        </div>
        <aside className="card h-fit">
          <h2 className="mb-4 text-2xl">Novo membro</h2>
          <ActionForm action={createStaffAction} submitLabel="Cadastrar" resetOnSuccess>
            <Field label="Nome *" name="full_name" required />
            <Field label="E-mail *" name="email" type="email" required />
            <Field label="Telefone" name="phone" type="tel" />
            <Select label="Papel" name="role" options={STAFF_ROLES} defaultValue="cerimonialista" />
            <Field label="Senha inicial *" name="password" required minLength={8} autoComplete="off" />
          </ActionForm>
        </aside>
      </div>
    </>
  );
}
