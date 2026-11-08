import { portfolio, services, testimonials } from "@/content/site";
import { LeadForm } from "./lead-form";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#efe7dc,transparent_55%),radial-gradient(circle_at_85%_70%,#e0d1bd,transparent_50%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:py-32">
          <p className="font-script text-4xl text-gold sm:text-5xl">ArtBrown Company</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-6xl">
            Organizamos o seu grande dia com elegância e cuidado
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            Assessoria e cerimonial de casamentos e eventos. Você vive o momento — nós cuidamos de cada detalhe.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#orcamento" className="btn btn-primary">
              Solicitar orçamento
            </a>
            <a href="#servicos" className="btn btn-outline">
              Conheça nossos serviços
            </a>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="scroll-mt-20 bg-ivory py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="O que fazemos" title="Serviços" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.title} className="card">
                <div className="mb-4 h-px w-10 bg-gold" />
                <h3 className="text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Portfólio */}
      <section id="portfolio" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="Histórias que contamos" title="Portfólio" />
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {portfolio.map((p, i) => (
              <figure key={p.title} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(${135 + i * 25}deg, #efe7dc, #cdb69a ${55 + i * 5}%, #8f7659)`,
                    }}
                  />
                )}
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white">
                  <p className="font-title text-xl">{p.title}</p>
                  <p className="text-xs uppercase tracking-wider opacity-85">{p.place}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="scroll-mt-20 bg-gold-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="Quem viveu, recomenda" title="Depoimentos" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="card flex flex-col">
                <span className="font-title text-5xl leading-none text-gold">“</span>
                <p className="flex-1 font-title text-xl italic leading-snug">{t.text}</p>
                <footer className="mt-4 text-sm font-semibold uppercase tracking-wider text-gold-700">{t.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Orçamento */}
      <section id="orcamento" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <SectionTitle kicker="Vamos conversar?" title="Solicite um orçamento" />
          <p className="mx-auto mt-4 max-w-xl text-center text-muted">
            Conte um pouco sobre o seu evento e retornaremos em até 2 dias úteis.
          </p>
          <div className="card mt-10">
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <p className="font-script text-3xl text-gold">{kicker}</p>
      <h2 className="mt-1 text-4xl sm:text-5xl">{title}</h2>
    </div>
  );
}
