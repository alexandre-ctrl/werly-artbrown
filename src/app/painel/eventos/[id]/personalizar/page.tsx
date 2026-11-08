import { getEvent } from "@/lib/events";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/format";
import { defaultTemplateFor, rsvpLink } from "@/lib/rsvp";
import { ActionForm } from "@/components/action-form";
import { Field, TextArea } from "@/components/fields";
import { updateInvitePageAction } from "./actions";

export default async function CustomizePage({ params }: PageProps<"/painel/eventos/[id]/personalizar">) {
  const { id } = await params;
  await requireProfile(["admin", "cerimonialista", "cliente"]);
  const event = await getEvent(id);
  const supabase = await createClient();
  const { data: sample } = await supabase.from("guest_groups").select("invite_token").eq("event_id", id).limit(1).maybeSingle();
  const cover = publicStorageUrl("public-assets", event.rsvp_cover_path);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card">
        <h2 className="mb-1 text-2xl">Página de confirmação de presença</h2>
        <p className="mb-6 text-sm text-muted">Personalize o que os convidados veem ao abrir o link do convite.</p>
        <ActionForm action={updateInvitePageAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={event.id} />
          <Field label="Título" name="rsvp_title" defaultValue={event.rsvp_title ?? ""} placeholder="Vamos celebrar juntos!" className="sm:col-span-2" />
          <TextArea label="Mensagem para os convidados" name="rsvp_message" rows={4} defaultValue={event.rsvp_message ?? ""} className="sm:col-span-2" />
          <Field label="Cor principal" name="rsvp_primary_color" type="color" defaultValue={event.rsvp_primary_color} className="[&_input]:h-11 [&_input]:p-1" />
          <Field label="Cor de fundo" name="rsvp_background_color" type="color" defaultValue={event.rsvp_background_color} className="[&_input]:h-11 [&_input]:p-1" />
          <Field label="Prazo para confirmar" name="rsvp_deadline" type="date" defaultValue={event.rsvp_deadline ?? ""} />
          <div>
            <label className="label" htmlFor="cover">Foto de capa</label>
            <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gold-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-700" />
            {cover && (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" name="remove_cover" className="accent-gold" /> Remover foto atual
              </label>
            )}
          </div>
          <TextArea
            label="Mensagem do WhatsApp"
            name="whatsapp_template"
            rows={7}
            defaultValue={event.whatsapp_template ?? defaultTemplateFor(event.type)}
            className="sm:col-span-2"
            hint="Variáveis: {nome} (convite), {noivos}, {evento}, {data}, {prazo}, {link}."
          />
        </ActionForm>
      </section>

      <aside className="space-y-4">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="Capa do convite" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        )}
        <div className="card text-sm">
          <p className="label">Pré-visualizar</p>
          {sample ? (
            <a href={rsvpLink(event.slug, sample.invite_token)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-1">
              Abrir página de um convite
            </a>
          ) : (
            <p className="text-muted">Cadastre um convidado para visualizar a página.</p>
          )}
          <p className="mt-3 text-xs text-muted">
            Atenção: ao abrir e responder pela pré-visualização, a resposta fica registrada para aquele convite.
          </p>
        </div>
      </aside>
    </div>
  );
}
