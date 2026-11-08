import Link from "next/link";
import { Logo } from "@/components/logo";
import { WhatsAppFloat } from "@/components/whatsapp-float";

const NAV = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#portfolio", label: "Portfólio" },
  { href: "/#depoimentos", label: "Depoimentos" },
  { href: "/#orcamento", label: "Orçamento" },
];

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="ArtBrown Company — início">
            <Logo className="h-12" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold uppercase tracking-wider text-muted md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-gold-700">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">
              Área do cliente
            </Link>
            <Link href="/#orcamento" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Pedir orçamento
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-ivory">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-muted md:grid-cols-3">
          <div>
            <Logo className="h-14" />
            <p className="mt-3 max-w-xs">Organização de casamentos e eventos com elegância e cuidado em cada detalhe.</p>
          </div>
          <div>
            <p className="label">Navegação</p>
            <ul className="space-y-1.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-gold-700">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Institucional</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/politica-de-privacidade" className="hover:text-gold-700">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-gold-700">
                  Área do cliente e equipe
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="border-t border-line py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} ArtBrown Company. Todos os direitos reservados.
        </p>
      </footer>
      <WhatsAppFloat />
    </>
  );
}
