import Link from "next/link";
import { Logo } from "@/components/logo";
import { RevealObserver } from "@/components/reveal";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { InstagramIcon } from "@/components/instagram-icon";
import { social } from "@/content/site";

const NAV = [
  { href: "/#servicos", label: "Serviços", n: "I" },
  { href: "/#processo", label: "Como trabalhamos", n: "II" },
  { href: "/#portfolio", label: "Portfólio", n: "III" },
  { href: "/#depoimentos", label: "Depoimentos", n: "IV" },
];

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="site flex min-h-full flex-1 flex-col">
      <header className="gutter sticky top-0 z-30 bg-gradient-to-b from-[#f8f3eb] from-55% via-[#f8f3ebd0] to-transparent pb-6 pt-4">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-6">
          <Link href="/" aria-label="ArtBrown Company — início" className="shrink-0">
            <Logo className="h-11" />
          </Link>
          <nav aria-label="Seções" className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="smallcaps transition hover:text-ink">
                <span className="mr-1.5 text-gold">{item.n}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="smallcaps hidden transition hover:text-ink sm:inline">
              Área do cliente
            </Link>
            <Link href="/#orcamento" className="btn btn-primary btn-sm">
              Orçamento
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="gutter pb-10 pt-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="rule-top grid gap-10 pt-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Logo className="h-14" />
              <p className="mt-4 max-w-sm font-title text-xl italic leading-snug text-ink/80">
                Organização de casamentos e eventos, com cuidado em cada detalhe.
              </p>
              <a
                href={social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-700 hover:text-ink"
              >
                <InstagramIcon className="h-5 w-5" /> {social.instagram.handle}
              </a>
            </div>
            <div>
              <p className="smallcaps mb-4 text-ink">Navegação</p>
              <ul className="space-y-2 text-sm text-muted">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-ink">{item.label}</Link>
                  </li>
                ))}
                <li><Link href="/#orcamento" className="hover:text-ink">Orçamento</Link></li>
              </ul>
            </div>
            <div>
              <p className="smallcaps mb-4 text-ink">Institucional</p>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/politica-de-privacidade" className="hover:text-ink">Política de privacidade</Link></li>
                <li><Link href="/login" className="hover:text-ink">Área do cliente e equipe</Link></li>
                <li>
                  <a href={social.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line pt-6">
            <p className="smallcaps">© {new Date().getFullYear()} ArtBrown Company</p>
            <p className="smallcaps">Casamentos · Eventos · Cerimonial</p>
          </div>
        </div>
      </footer>
      <WhatsAppFloat />
      <RevealObserver />
    </div>
  );
}
