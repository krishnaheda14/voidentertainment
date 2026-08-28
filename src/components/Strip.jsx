import { venues, stats, howItWorks } from '../data/site'
import { Reveal, SectionHead } from './ui'

/* ==========================================================================
   MARQUEE — two bands running against each other, like a club's LED ticker.
   Children are duplicated once so the -50% keyframe loops seamlessly.
   ========================================================================== */
function Band({ items, direction = 'l', accent = false }) {
  const row = [...items, ...items]
  return (
    <div className="hover-pause edge-fade overflow-hidden py-3">
      <div
        className={
          direction === 'l'
            ? 'marquee-track animate-marquee-l'
            : 'marquee-track animate-marquee-r'
        }
      >
        {row.map((t, i) => (
          <span key={i} className="flex shrink-0 items-center">
            <span
              className={
                accent
                  ? 'px-6 font-display text-[clamp(1.6rem,4.2vw,3rem)] uppercase text-flare'
                  : 'metal px-6 font-display text-[clamp(1.6rem,4.2vw,3rem)] uppercase'
              }
            >
              {t}
            </span>
            <span className="h-1.5 w-1.5 rotate-45 bg-flare/70" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  )
}

export function Ticker() {
  const rooms = venues.map((v) => v.name)
  const services = [
    'Guestlist',
    'Tables',
    'Stag entry',
    'Birthdays',
    'Bachelorettes',
    'Sundowners',
    'Corporate nights',
  ]
  return (
    <section aria-hidden className="relative border-y border-silver/10 bg-void-100/50 py-4">
      <Band items={rooms} direction="l" accent />
      <div className="rule my-1" />
      <Band items={services} direction="r" />
    </section>
  )
}

/* ==========================================================================
   LEDGER — the numbers, set as a run-sheet rather than four stat cards.
   ========================================================================== */
export function Ledger() {
  return (
    <section className="shell py-16 sm:py-20">
      <div className="rule mb-8" />
      <dl className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <div className="border-silver/10 px-0 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0">
              <dt className="metal-flare font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-none">
                {s.value}
              </dt>
              <dd className="mt-2">
                <span className="block font-mono text-[11px] uppercase tracking-widest2 text-silver">
                  {s.label}
                </span>
                <span className="mt-1 block font-mono text-[10px] text-silver-lo">
                  {s.note}
                </span>
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>
      <div className="rule mt-8" />
    </section>
  )
}

/* ==========================================================================
   PROCESS — genuinely a sequence, so the numbers carry meaning.
   ========================================================================== */
export function Process() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow="How it works · 3 steps"
          title="No app. No queue."
          meta="There is nothing to sign up for. The entire booking happens in one WhatsApp thread with a person who can call the venue while you are typing."
        />

        <ol className="grid gap-px bg-silver/10 md:grid-cols-3">
          {howItWorks.map((s, i) => (
            <li key={s.step} className="bg-void-000">
              <Reveal delay={i * 0.1}>
                <div className="group relative h-full bg-void-000 p-7 transition-colors duration-500 hover:bg-void-100 sm:p-9">
                  <span className="font-mono text-[11px] tracking-widest2 text-flare">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="metal mt-5 text-[clamp(1.5rem,3.6vw,2.1rem)] transition-colors">
                    {s.step}
                  </h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-silver-mid">
                    {s.body}
                  </p>
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-px w-0 bg-flare transition-all duration-700 group-hover:w-full"
                  />
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
