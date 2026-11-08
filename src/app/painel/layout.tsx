import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { Logo } from "@/components/logo";
import { PanelNav, type NavItem } from "./panel-nav";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/painel">) {
  const profile = await requireProfile();

  const items: NavItem[] = [{ href: "/painel", label: "Início", exact: true }];
  if (profile.role === "admin") {
    items.push(
      { href: "/painel/eventos", label: "Eventos" },
      { href: "/painel/clientes", label: "Clientes" },
      { href: "/painel/leads", label: "Leads" },
      { href: "/painel/equipe", label: "Equipe" },
    );
  } else if (profile.role === "cliente") {
    items.push({ href: "/painel/eventos", label: "Meu evento" });
  } else {
    items.push({ href: "/painel/eventos", label: "Meus eventos" });
  }
  items.push({ href: "/painel/conta", label: "Minha conta" });

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-line bg-ivory md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:flex-col md:items-stretch md:py-6">
          <Link href="/painel" className="flex justify-center">
            <Logo className="h-12 md:h-16" />
          </Link>
          <div className="text-right md:mt-4 md:text-center">
            <p className="truncate text-sm font-semibold">{profile.full_name || profile.email}</p>
            <p className="text-xs uppercase tracking-wider text-gold-700">{ROLE_LABEL[profile.role]}</p>
          </div>
        </div>
        <PanelNav items={items} />
        <form action={signOut} className="hidden px-4 pb-6 md:mt-4 md:block">
          <button className="btn btn-ghost btn-sm w-full">Sair</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
        <form action={signOut} className="px-4 pb-8 md:hidden">
          <button className="btn btn-ghost btn-sm w-full">Sair</button>
        </form>
      </div>
    </div>
  );
}
