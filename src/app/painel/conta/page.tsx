import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { changePasswordAction, updateAccountAction } from "./actions";

export default async function AccountPage() {
  const profile = await requireProfile();
  return (
    <>
      <PageHeader title="Minha conta" subtitle={profile.email} />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-2xl">Dados</h2>
          <ActionForm action={updateAccountAction}>
            <Field label="Nome" name="full_name" defaultValue={profile.full_name} required />
            <Field label="Telefone" name="phone" defaultValue={profile.phone ?? ""} />
          </ActionForm>
        </section>
        <section className="card">
          <h2 className="mb-4 text-2xl">Alterar senha</h2>
          <ActionForm action={changePasswordAction} resetOnSuccess submitLabel="Alterar senha">
            <Field label="Nova senha" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <Field label="Confirmar nova senha" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </ActionForm>
        </section>
      </div>
    </>
  );
}
