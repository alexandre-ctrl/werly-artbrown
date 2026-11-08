import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { Field, TextArea } from "@/components/fields";
import { createClientAction } from "../actions";

export default async function NewClientPage() {
  await requireProfile(["admin"]);
  return (
    <>
      <PageHeader title="Novo cliente" />
      <div className="card max-w-2xl">
        <ActionForm action={createClientAction} submitLabel="Cadastrar cliente" className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome (ex.: Ana & Pedro) *" name="name" required className="sm:col-span-2" />
          <Field label="E-mail" name="email" type="email" />
          <Field label="Telefone / WhatsApp" name="phone" type="tel" />
          <Field label="CPF / CNPJ" name="document" />
          <TextArea label="Observações" name="notes" className="sm:col-span-2" />
          <fieldset className="rounded-xl border border-line p-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="give_access" className="accent-gold" /> Criar acesso à Área do Cliente
            </label>
            <Field label="Senha inicial (mín. 8 caracteres)" name="password" type="text" autoComplete="off" className="mt-3" hint="Usa o e-mail acima como login. Envie a senha ao cliente e peça para trocá-la em “Minha conta”." />
          </fieldset>
        </ActionForm>
      </div>
    </>
  );
}
