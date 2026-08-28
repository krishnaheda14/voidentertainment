import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, MapPin, MessageCircle } from 'lucide-react'
import { brand, week, venues } from '../data/site'
import logo from '../data/logo-mark.png'
import {
  nightlifeDay,
  scrollToId,
  timeToDoor,
  useIST,
  waBooking,
  waLink,
} from '../lib/utils'
import { VoidButton, StatusDot } from './ui'

/* ==========================================================================
   EMBERS — ambient canvas. Cheap, capped, and it stops dead on reduced motion.
   ========================================================================== */
function Embers() {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let raf
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      w = cv.offsetWidth
      h = cv.offsetHeight
      cv.width = w * dpr
      cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = window.innerWidth < 768 ? 26 : 54
    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.7 + 0.4,
      vy: -(Math.random() * 0.36 + 0.09),
      vx: (Math.random() - 0.5) * 0.16,
      a: Math.random() * 0.5 + 0.12,
      hot: Math.random() > 0.55,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.y += p.vy
        p.x += p.vx
        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.hot
          ? `rgba(255,138,61,${p.a})`
          : `rgba(188,195,203,${p.a * 0.55})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduce])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
    />
  )
}

/* ==========================================================================
   TONIGHT RAIL — the signature.
   Reads the real Bombay clock, works out which night it is (anything before
   06:00 still counts as the night before), and counts down to the first door.
   ========================================================================== */
export function TonightRail() {
  const now = useIST()
  const today = nightlifeDay(now)
  const block = week.find((d) => d.day === today)
  const events = block?.events ?? []
  const first = events[0]
  const venue = first ? venues.find((v) => v.slug === first.venue) : null
  const cd = first ? timeToDoor(first.door, now) : null

  return (
    <div id="tonight" className="relative scroll-mt-24">
      <div className="rule-flare" />
      <div className="panel border-x-0 border-b-0">
        <div className="shell grid gap-6 py-6 lg:grid-cols-[auto,1fr,auto] lg:items-center lg:gap-10 lg:py-7">
          {/* live clock block */}
          <div className="flex items-center gap-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flare opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-flare" />
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
                Bombay · {now.clock} IST
              </div>
              <div className="metal font-display text-2xl leading-none sm:text-3xl">
                {block?.long ?? 'Tonight'}
              </div>
            </div>
          </div>

          {/* what's on */}
          {first && venue ? (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-silver/10 pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <span className="font-display text-xl text-flare sm:text-2xl">
                {first.title}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest2 text-silver">
                {venue.name}
              </span>
              <span className="font-mono text-[11px] text-silver-lo">
                {venue.area}
              </span>
              <StatusDot status={first.status} />
              <span className="w-full font-mono text-[11px] text-silver-mid sm:w-auto">
                {cd?.open ? (
                  <span className="text-emerald-400">Doors open now</span>
                ) : (
                  <>
                    Doors in <span className="text-silver-hi">{cd?.label}</span>
                  </>
                )}
                {events.length > 1 && (
                  <span className="text-silver-lo">
                    {' '}
                    · +{events.length - 1} more room{events.length > 2 ? 's' : ''}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-silver-mid lg:border-l lg:border-silver/10 lg:pl-10">
              Nothing listed tonight. Message us — we still have doors open.
            </p>
          )}

          <VoidButton
            href={waBooking({
              venue: venue?.name,
              night: block?.long,
              title: first?.title,
            })}
            size="sm"
            variant="dark"
            className="justify-self-start lg:justify-self-end"
          >
            <MessageCircle size={13} strokeWidth={2.5} />
            Get me in tonight
          </VoidButton>
        </div>
      </div>
      <div className="rule" />
    </div>
  )
}

/* ==========================================================================
   HERO
   ========================================================================== */
export default function Hero({ ready }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  const letters = 'VOID'.split('')

  return (
    <section id="top" ref={ref} className="relative">
      <div className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-24">
        <Embers />

        {/* door frame — the two uprights from the preloader, kept as structure */}
        <div className="pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-gradient-to-b from-transparent via-silver/20 to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-y-0 right-6 hidden w-px bg-gradient-to-b from-transparent via-silver/20 to-transparent lg:block" />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 animate-door-pulse rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,90,0,.30), rgba(255,90,0,.06) 42%, transparent 68%)',
            filter: 'blur(30px)',
          }}
          aria-hidden
        />

        <motion.div style={reduce ? {} : { y, opacity: fade }} className="relative z-10">
          <div className="shell pb-10 sm:pb-14">
            {/* mark */}
            <motion.img
              src={logo}
              alt="Void Entertainment"
              initial={{ opacity: 0, y: 14 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05, duration: 0.7 }}
              className="mb-6 h-16 w-auto sm:h-20"
            />

            {/* eyebrow row — real data, not decoration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mb-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo"
            >
              <span className="flex items-center gap-1.5 text-flare">
                <MapPin size={11} /> Bombay
              </span>
              <span>Est. 2022</span>
              <span className="hidden sm:inline">5 house venues</span>
              <span className="hidden md:inline">{brand.hours}</span>
            </motion.div>

            {/* the wordmark */}
            <h1 className="flex flex-wrap items-baseline leading-[0.8]">
              <span className="sr-only">Void Entertainment — nightlife access in Bombay</span>
              <span aria-hidden className="flex">
                {letters.map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: '110%', opacity: 0 }}
                    animate={ready ? { y: '0%', opacity: 1 } : {}}
                    transition={{
                      delay: 0.1 + i * 0.07,
                      duration: 0.9,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="metal-flare inline-block font-display text-[clamp(5rem,25vw,20rem)] tracking-tightest"
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-2"
            >
              <span className="metal font-display text-[clamp(1.1rem,4.6vw,3.2rem)] tracking-[0.06em]">
                ENTERTAINMENT
              </span>
              <span className="h-px flex-1 bg-silver/15" />
            </motion.div>

            {/* thesis line + CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.62, duration: 0.7 }}
              className="mt-9 grid gap-8 md:grid-cols-[1.25fr,1fr] md:items-end"
            >
              <p className="max-w-xl text-lg leading-snug text-silver sm:text-2xl">
                Five of Bombay's hardest rooms.{' '}
                <span className="text-silver-hi">One number.</span> We hold the
                guestlists, we price the tables, and we get you through the door
                for less than you would pay standing in it.
              </p>

              <div className="flex flex-wrap gap-3">
                <VoidButton
                  href={waLink(
                    'Hi Void — I want to book a night out in Bombay. Date: , Headcount: '
                  )}
                  size="lg"
                >
                  <MessageCircle size={15} strokeWidth={2.5} />
                  Message the desk
                </VoidButton>
                <VoidButton onClick={() => scrollToId('week')} size="lg" variant="ghost">
                  See the week
                </VoidButton>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* scroll cue */}
        <motion.button
          onClick={() => scrollToId('week')}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          style={reduce ? {} : { opacity: fade }}
          className="absolute bottom-[7.5rem] right-6 hidden flex-col items-center gap-3 font-mono text-[9px] uppercase tracking-widest2 text-silver-lo lg:flex"
          aria-label="Scroll to this week's schedule"
        >
          <span className="[writing-mode:vertical-rl]">Scroll</span>
          <ArrowDown size={13} className="animate-bounce text-flare" />
        </motion.button>
      </div>

      <TonightRail />
    </section>
  )
}
