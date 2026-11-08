import { portfolio, process, services, testimonials } from "@/content/site";
import { LeadForm } from "./lead-form";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export default function HomePage() {
  const [featured, ...others] = testimonials;

  return (
    <>
      {/* Frontispício */}
      <section className="gutter">
        <div className="mx-auto grid min-h-[calc(100svh-88px)] max-w-[1320px] items-center gap-12 py-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
          <div>
            <p className="kicker rise">Assessoria · Cerimonial · Eventos</p>
            <h1 className="display rise mt-8 text-[clamp(2.9rem,7vw,6.6rem)]" style={{ "--delay": "80ms" } as React.CSSProperties}>
              O seu grande dia, <em>organizado</em> com elegância.
            </h1>
            <p
              className="rise mt-8 max-w-[40ch] font-title text-[clamp(1.15rem,1.5vw,1.45rem)] italic leading-snug text-ink/75"
              style={{ "--delay": "180ms" } as React.CSSProperties}
            >
              Cuidamos de cada detalhe do casamento ou do seu evento, do primeiro sonho ao último convidado, para que você
              viva o momento.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-8" style={{ "--delay": "260ms" } as React.CSSProperties}>
              <a href="#orcamento" className="btn btn-primary px-7 py-3">Solicitar orçamento</a>
              <a href="#servicos" className="link-line">Conheça os serviços</a>
            </div>
          </div>

          <figure className="rise w-full max-w-[480px] justify-self-center lg:justify-self-end" style={{ "--delay": "200ms" } as React.CSSProperties}>
            <div className="plate aspect-[4/5]">
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_10%,#fbf7f0,#e8dccb_55%,#cdb69a)]" />
              <div className="absolute inset-[7%] border border-white/60" />
              <div className="absolute inset-0 flex items-center justify-center p-[14%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ArtBrown Company" className="w-full drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
              </div>
            </div>
            <figcaption className="plate-caption">
              <span>Organização de eventos</span>
              <span>Prancha I</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* I · Serviços */}
      <section id="servicos" className="gutter scroll-mt-24 py-[clamp(64px,10vh,120px)]">
        <div className="mx-auto max-w-[1320px]">
          <Chapter n="I" kicker="O que fazemos" title={<>Serviços pensados para <em>cada etapa</em></>} />
          <ol className="grid border-t border-line md:grid-cols-2">
            {services.map((s, i) => (
              <li
                key={s.title}
                data-reveal
                style={{ "--delay": `${(i % 2) * 90}ms` } as React.CSSProperties}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-8 md:odd:border-r md:odd:pr-10 md:even:pl-10"
              >
                <span className="pt-1.5 font-title text-lg italic text-gold-700">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-[clamp(1.6rem,2.2vw,2.1rem)] leading-tight">{s.title}</h3>
                  <p className="mt-2 max-w-[46ch] leading-relaxed text-muted">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* II · Como trabalhamos */}
      <section id="processo" className="gutter scroll-mt-24 bg-ivory/70 py-[clamp(64px,10vh,120px)]">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Chapter compact n="II" kicker="Como trabalhamos" title={<>Do primeiro café ao <em>último brinde</em></>} />
            <p className="drop-cap max-w-[44ch] text-lg leading-relaxed text-ink/80">
              Cada evento tem uma história. Nosso trabalho é transformá-la em um dia leve para quem celebra e
              inesquecível para quem participa, com organização, tecnologia e um olhar atento a cada detalhe.
            </p>
          </div>
          <ol className="space-y-0">
            {process.map((step, i) => (
              <li key={step.title} data-reveal className="grid grid-cols-[5rem_1fr] gap-6 border-t border-line py-8 last:border-b">
                <span className="display text-[clamp(2.6rem,4vw,3.6rem)] text-gold">{ROMAN[i]}</span>
                <div>
                  <h3 className="text-[clamp(1.5rem,2vw,1.9rem)]">{step.title}</h3>
                  <p className="mt-2 max-w-[48ch] leading-relaxed text-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* III · Portfólio */}
      <section id="portfolio" className="gutter scroll-mt-24 py-[clamp(64px,10vh,120px)]">
        <div className="mx-auto max-w-[1320px]">
          <Chapter n="III" kicker="Histórias que contamos" title={<>Um <em>portfólio</em> de celebrações</>} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3">
            {portfolio.map((p, i) => (
              <figure
                key={p.title}
                data-reveal
                style={{ "--delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
                className={i % 3 === 1 ? "lg:translate-y-12" : undefined}
              >
                <div className="plate aspect-[4/5]">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ background: `linear-gradient(${150 + i * 18}deg, #f3ece1, #d9c6ad ${50 + i * 4}%, #a98f71)` }}
                    />
                  )}
                </div>
                <figcaption className="mt-4">
                  <p className="font-title text-xl leading-tight sm:text-2xl">{p.title}</p>
                  <div className="plate-caption mt-1">
                    <span>{p.place}</span>
                    <span className="hidden sm:inline">Prancha {ROMAN[i + 1]}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* IV · Depoimentos */}
      <section id="depoimentos" className="gutter scroll-mt-24 py-[clamp(64px,10vh,120px)] lg:pt-[clamp(96px,14vh,160px)]">
        <div className="mx-auto max-w-[1320px]">
          <Chapter n="IV" kicker="Quem viveu, recomenda" title={<>Palavras de quem <em>celebrou</em> conosco</>} />
          {featured && (
            <figure data-reveal className="rule-top grid gap-6 border-b border-line py-10 lg:grid-cols-[2fr_1fr] lg:items-center lg:gap-16">
              <blockquote className="font-title text-[clamp(1.7rem,3vw,2.8rem)] font-normal italic leading-[1.15] tracking-[-0.01em] text-balance">
                <span className="text-gold">“</span>
                {featured.text}
                <span className="text-gold">”</span>
              </blockquote>
              <figcaption className="smallcaps leading-loose">
                <span className="block text-ink">{featured.name}</span>
                Clientes ArtBrown
              </figcaption>
            </figure>
          )}
          <div className="grid gap-10 pt-10 md:grid-cols-2">
            {others.map((t, i) => (
              <figure key={t.name} data-reveal style={{ "--delay": `${i * 90}ms` } as React.CSSProperties} className="border-l border-line pl-6">
                <blockquote className="font-title text-xl italic leading-snug text-ink/85">“{t.text}”</blockquote>
                <figcaption className="smallcaps mt-4 text-gold-700">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* V · Orçamento */}
      <section id="orcamento" className="gutter scroll-mt-24 bg-ivory/70 py-[clamp(64px,10vh,120px)]">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <Chapter compact n="V" kicker="Vamos conversar?" title={<>Conte-nos sobre o <em>seu evento</em></>} />
            <p className="max-w-[40ch] text-lg leading-relaxed text-ink/80">
              Preencha o formulário com o que você já sabe: data, local, número de convidados. Retornamos em até
              2 dias úteis.
            </p>
            <dl className="mt-10 space-y-4 border-l border-line pl-6 text-sm">
              <div>
                <dt className="smallcaps">Atendimento</dt>
                <dd className="mt-1 text-ink/80">Casamentos, 15 anos, aniversários, bodas e eventos corporativos.</dd>
              </div>
              <div>
                <dt className="smallcaps">Prefere conversar agora?</dt>
                <dd className="mt-1 text-ink/80">Use o botão do WhatsApp no canto da tela.</dd>
              </div>
            </dl>
          </div>
          <div data-reveal className="rounded-sm border border-line bg-white/80 p-[clamp(20px,3vw,40px)] shadow-[0_34px_70px_-40px_rgba(58,49,41,0.35)]">
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}

function Chapter({ n, kicker, title, compact = false }: { n: string; kicker: string; title: React.ReactNode; compact?: boolean }) {
  return (
    <header data-reveal className="mb-12 flex items-end justify-between gap-6">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="display mt-5 max-w-[18ch] text-[clamp(2.3rem,5vw,4.6rem)]">{title}</h2>
      </div>
      <span aria-hidden="true" className={`display hidden text-[clamp(4rem,8vw,7.5rem)] leading-none text-gold/25 ${compact ? "sm:block lg:hidden" : "sm:block"}`}>
        {n}
      </span>
    </header>
  );
}
