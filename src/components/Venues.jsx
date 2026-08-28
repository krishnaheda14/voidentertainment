import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { MapPin, MessageCircle, Navigation } from 'lucide-react'
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
          ? 'h-[74vh] w-[min(88vw,1080px)] shrink-0 lg:flex-row'
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
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reduce = useReducedMotion()
  const horizontal = isDesktop && !reduce

  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const [distance, setDistance] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useEffect(() => {
    if (!horizontal) {
      setDistance(0)
      return
    }
    const calc = () => {
      const el = trackRef.current
      if (!el) return
      setDistance(Math.max(0, el.scrollWidth - window.innerWidth + 48))
      // section height changes with `distance`; make the scroll tracker re-measure
      requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')))
    }
    calc()
    const t = setTimeout(calc, 400) // after fonts/images settle
    window.addEventListener('resize', calc)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', calc)
    }
  }, [horizontal])

  return (
    <section id="venues" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow={`The rooms · ${venues.length} venues`}
          title="Where we work"
          meta="These are our house rooms. We know the door staff, the floor managers and the table map at every one of them, which is the only reason any of this works."
        />
      </div>

      {horizontal ? (
        <div
          ref={sectionRef}
          style={{ height: `calc(100vh + ${distance}px)` }}
          className="relative"
        >
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            <motion.div
              ref={trackRef}
              style={{ x }}
              className="flex gap-6 pl-6 pr-6 xl:pl-12"
            >
              {venues.map((v, i) => (
                <VenueCard key={v.slug} v={v} index={i} horizontal />
              ))}
            </motion.div>

            {/* floor progress */}
            <div className="absolute bottom-10 left-1/2 w-[min(46vw,420px)] -translate-x-1/2">
              <div className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-widest2 text-silver-lo">
                <span>Bandra</span>
                <span>Scroll the floor</span>
                <span>Worli</span>
              </div>
              <div className="h-px w-full bg-silver/15">
                <motion.div style={{ width: progress }} className="h-px bg-flare" />
              </div>
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
