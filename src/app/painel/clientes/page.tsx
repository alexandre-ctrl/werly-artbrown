import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/page-header";

export default async function ClientsPage({ searchParams }: PageProps<"/painel/clientes">) {
  await requireProfile(["admin"]);
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const supabase = await createClient();
  let query = supabase.from("clients").select("*, events(id, title, event_date)").order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search.replace(/[%,()]/g, "")}%,email.ilike.%${search.replace(/[%,()]/g, "")}%`);
  const { data: clients } = await query;

  return (
    <>
      <PageHeader title="Clientes" actions={<Link href="/painel/clientes/novo" className="btn btn-primary">Novo cliente</Link>} />
      <form className="mb-6 flex gap-2">
        <input name="q" defaultValue={search} placeholder="Buscar por nome ou e-mail" className="input max-w-sm" />
        <button className="btn btn-outline">Buscar</button>
      </form>
      {!clients?.length ? (
        <EmptyState>Nenhum cliente encontrado.</EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr><th>Nome</th><th>Contato</th><th>Eventos</th><th>Acesso</th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/painel/clientes/${c.id}`} className="font-semibold text-gold-700 hover:underline">{c.name}</Link></td>
                  <td className="text-muted">{c.email}<br />{c.phone}</td>
                  <td>{(c.events as { id: string; title: string }[]).map((e) => (
                    <Link key={e.id} href={`/painel/eventos/${e.id}`} className="block hover:underline">{e.title}</Link>
                  ))}</td>
                  <td>{c.user_id ? <span className="badge bg-emerald-50 text-emerald-800">Ativo</span> : <span className="badge bg-stone-100 text-stone-600">Sem login</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
