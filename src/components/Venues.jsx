import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Navigation } from 'lucide-react'
import { venues } from '../data/site'
import { cx, useMediaQuery, waBooking } from '../lib/utils'
import { Reveal, SectionHead, SmartImage, VoidButton } from './ui'

function DataRow({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-silver/10 py-2">
      <dt className="font-mono text-[9px] uppercase tracking-widest2 text-silver-lo">
        {k}
      </dt>
      <dd className="text-right font-mono text-[11px] text-silver-hi">{v}</dd>
    </div>
  )
}

function VenueCard({ v, index, horizontal }) {
  return (
    <article
      className={cx(
        'panel group relative flex flex-col overflow-hidden',
        horizontal
          ? 'h-[74vh] w-[min(80vw,980px)] shrink-0 lg:flex-row'
          : 'w-full'
      )}
    >
      {/* image side */}
      <div
        className={cx(
          'relative overflow-hidden',
          horizontal ? 'h-[38%] lg:h-full lg:w-[46%]' : 'h-56 sm:h-72'
        )}
      >
        <SmartImage
          src={v.image}
          alt={`${v.name}, ${v.area}`}
          caption={v.name}
          className="h-full w-full"
          imgClass="transition-transform duration-[1.4s] ease-out group-hover:scale-[1.07]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-000 via-void-000/25 to-transparent lg:bg-gradient-to-r" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_20%_100%,rgba(255,90,0,.22),transparent_60%)]" />

        {/* coordinates — the structural marker for a venue is where it is */}
        <div className="absolute left-4 top-4 flex items-center gap-2 border border-silver/20 bg-void-000/70 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-silver backdrop-blur">
          <MapPin size={10} className="text-flare" />
          {v.coords[0].toFixed(4)}°N {v.coords[1].toFixed(4)}°E
        </div>
      </div>

      {/* content side */}
      <div
        className={cx(
          'flex flex-1 flex-col justify-between gap-6 p-6 sm:p-8',
          horizontal && 'lg:overflow-y-auto'
        )}
      >
        <div>
          <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            <span className="text-flare">{v.area}</span>
            <span className="h-px w-6 bg-silver/25" />
            <span>PIN {v.pin}</span>
          </div>

          <h3 className="metal text-[clamp(2rem,5.4vw,3.6rem)] leading-[0.86]">
            {v.name}
          </h3>

          <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-silver-mid">
            {v.blurb}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {v.tags.map((t) => (
              <span
                key={t}
                className="border border-flare/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest2 text-flare"
              >
                {t}
              </span>
            ))}
          </div>

          <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
            <DataRow k="Doors" v={`${v.door} – ${v.close}`} />
            <DataRow k="Capacity" v={`~${v.capacity}`} />
            <DataRow k="Floor" v={v.floor} />
            <DataRow k="Best night" v={v.best} />
            <div className="sm:col-span-2">
              <DataRow k="Sound" v={v.sound} />
              <DataRow k="Dress code" v={v.dress} />
            </div>
          </dl>
        </div>

        <div>
          <p className="mb-4 font-mono text-[10px] leading-relaxed text-silver-lo">
            {v.address}
          </p>
          <div className="flex flex-wrap gap-3">
            <VoidButton href={waBooking({ venue: v.name })} size="sm">
              <MessageCircle size={13} strokeWidth={2.5} />
              Get me in
            </VoidButton>
            <VoidButton href={v.maps} size="sm" variant="ghost">
              <Navigation size={13} />
              Open in Maps
            </VoidButton>
          </div>
        </div>
      </div>

      <span className="pointer-events-none absolute right-5 top-5 font-mono text-[10px] tracking-widest2 text-silver-lo">
        {String(index + 1).padStart(2, '0')} / {String(venues.length).padStart(2, '0')}
      </span>
    </article>
  )
}

export default function Venues() {
  const horizontal = useMediaQuery('(min-width: 1024px)')
  const n = venues.length

  const trackRef = useRef(null)
  const cardRefs = useRef([])
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!horizontal) return
    const el = trackRef.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setProgress(max > 0 ? el.scrollLeft / max : 0)

      let nearest = 0
      let best = Infinity
      cardRefs.current.forEach((c, i) => {
        if (!c) return
        const d = Math.abs(c.offsetLeft - el.scrollLeft)
        if (d < best) {
          best = d
          nearest = i
        }
      })
      setCurrent(nearest)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [horizontal])

  // Circular: past the last card, next wraps to the first (and back again from prev).
  const nudge = (dir) => {
    const target = (current + dir + n) % n
    cardRefs.current[target]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    })
  }

  const arrowClass =
    'grid h-12 w-12 place-items-center border border-silver/25 bg-void-000/80 text-silver backdrop-blur transition-all duration-300 hover:border-flare hover:bg-flare hover:text-void-000'

  return (
    <section id="venues" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow="Filling fast · Mumbai"
          title="Where we work"
          meta="We work with every serious room in Mumbai — these are the ones filling up fastest right now. Do not see the one you want? Message the desk, we probably already have a door there."
        />
      </div>

      {horizontal ? (
        <div className="relative">
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pl-6 pr-6 xl:pl-12"
          >
            {venues.map((v, i) => (
              <div
                key={v.slug}
                ref={(el) => (cardRefs.current[i] = el)}
                className="snap-start scroll-ml-6 xl:scroll-ml-12"
              >
                <VenueCard v={v} index={i} horizontal />
              </div>
            ))}
          </div>

          {/* arrows — the carousel loops, so these never disable */}
          <button
            onClick={() => nudge(-1)}
            aria-label="Previous venue"
            className={cx(arrowClass, 'absolute left-4 top-1/2 z-10 -translate-y-1/2 xl:left-8')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => nudge(1)}
            aria-label="Next venue"
            className={cx(arrowClass, 'absolute right-4 top-1/2 z-10 -translate-y-1/2 xl:right-8')}
          >
            <ChevronRight size={18} />
          </button>

          {/* floor progress */}
          <div className="mx-auto mt-8 w-[min(46vw,420px)]">
            <div className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-widest2 text-silver-lo">
              <span>Bandra</span>
              <span>Walk the floor</span>
              <span>Juhu</span>
            </div>
            <div className="h-px w-full bg-silver/15">
              <div
                style={{ width: `${Math.round(progress * 100)}%` }}
                className="h-px bg-flare transition-[width] duration-150"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="shell grid gap-6">
          {venues.map((v, i) => (
            <Reveal key={v.slug} delay={i * 0.04}>
              <VenueCard v={v} index={i} horizontal={false} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
