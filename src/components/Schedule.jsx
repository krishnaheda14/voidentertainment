import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Clock, Music2, Users } from 'lucide-react'
import { venues } from '../data/site'
import { cx, nightlifeDay, waBooking } from '../lib/utils'
import { useOverridableWeek } from '../lib/admin'
import { Reveal, SectionHead, SmartImage, StatusDot } from './ui'

function EventRow({ ev, day, index }) {
  const venue = venues.find((v) => v.slug === ev.venue)
  const [hover, setHover] = useState(false)
  const closed = ev.status === 'closed'

  return (
    <motion.a
      href={waBooking({ venue: venue?.name, night: day.long, title: ev.title })}
      target="_blank"
      rel="noreferrer noopener"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cx(
        'group relative block border-b border-silver/10',
        closed && 'opacity-55'
      )}
      data-cursor
    >
      {/* orange wash sweeping in from the left on hover */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-flare/16 via-flare/5 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-flare transition-transform duration-500 group-hover:scale-y-100"
      />

      <div className="relative grid gap-4 px-2 py-6 sm:px-4 lg:grid-cols-[6.5rem,1fr,auto] lg:items-center lg:gap-8 lg:py-7">
        {/* door time — the data column */}
        <div className="font-mono text-flare">
          <div className="text-xl sm:text-2xl">{ev.door}</div>
          <div className="text-[9px] uppercase tracking-widest2 text-silver-lo">
            Doors
          </div>
        </div>

        {/* the body */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="metal text-[clamp(1.6rem,5vw,2.6rem)] transition-all duration-300 group-hover:text-flare group-hover:[-webkit-text-fill-color:currentColor]">
              {ev.title}
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-widest2 text-silver">
              @ {venue?.name}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-silver-mid">{ev.sub}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            <span className="flex items-center gap-1.5">
              <Music2 size={11} className="text-flare" /> {ev.artist}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} className="text-flare" /> {venue?.area}
            </span>
            <StatusDot status={ev.status} />
          </div>
        </div>

        {/* pricing block + hover thumbnail */}
        <div className="flex items-center gap-6">
          <dl className="grid min-w-[10.5rem] gap-1.5 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <dt className="text-silver-lo">Couple</dt>
              <dd className="text-silver-hi">{ev.couple}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-silver-lo">Stag</dt>
              <dd className="text-silver-hi">{ev.stag}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-silver/10 pt-1.5">
              <dt className="text-silver-lo">Table</dt>
              <dd className="text-flare">{ev.table}</dd>
            </div>
          </dl>

          <div className="hidden xl:block">
            <motion.div
              animate={{ width: hover ? 132 : 0, opacity: hover ? 1 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <SmartImage
                src={venue?.image}
                alt={`${venue?.name} — ${venue?.area}`}
                caption={venue?.name}
                className="h-[88px] w-[132px]"
              />
            </motion.div>
          </div>

          <span className="grid h-11 w-11 shrink-0 place-items-center border border-silver/15 text-silver transition-colors duration-300 group-hover:border-flare group-hover:bg-flare group-hover:text-void-000">
            <ArrowUpRight size={17} />
          </span>
        </div>
      </div>
    </motion.a>
  )
}

export default function Schedule() {
  const { week, weekLabel } = useOverridableWeek()
  const today = useMemo(() => nightlifeDay(), [])
  const [active, setActive] = useState(() =>
    Math.max(0, week.findIndex((d) => d.day === today))
  )
  const day = week[Math.min(active, week.length - 1)] ?? week[0]

  return (
    <section id="week" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow={`The week · ${weekLabel}`}
          title="The lineup"
          meta="Pick a night. Every rate below is what you actually pay through us, not the walk-up number. Rates move — the desk confirms on WhatsApp before anything is held."
        />

        {/* day tabs */}
        <Reveal>
          <div
            className="no-scrollbar -mx-5 mb-2 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Nights of the week"
          >
            {week.map((d, i) => {
              const isToday = d.day === today
              const isActive = i === active
              return (
                <button
                  key={d.day}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={cx(
                    'relative shrink-0 border px-5 py-3 text-left transition-all duration-300',
                    isActive
                      ? 'border-flare bg-flare text-void-000'
                      : 'border-silver/15 text-silver-mid hover:border-silver/40 hover:text-silver-hi'
                  )}
                >
                  <span className="block font-display text-lg leading-none">
                    {d.day}
                  </span>
                  <span
                    className={cx(
                      'mt-1 block font-mono text-[9px] uppercase tracking-widest2',
                      isActive ? 'text-void-000/70' : 'text-silver-lo'
                    )}
                  >
                    {d.events.length} room{d.events.length === 1 ? '' : 's'}
                  </span>
                  {isToday && !isActive && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 animate-blink rounded-full bg-flare" />
                  )}
                </button>
              )
            })}
          </div>
        </Reveal>

        {today === day.day && (
          <p className="mb-6 font-mono text-[10px] uppercase tracking-widest2 text-flare">
            ● You are looking at tonight
          </p>
        )}

        {/* rows */}
        <div className="border-t border-silver/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={day.day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {day.events.length ? (
                day.events.map((ev, i) => (
                  <EventRow key={ev.title + i} ev={ev} day={day} index={i} />
                ))
              ) : (
                <p className="px-2 py-14 text-center font-mono text-sm text-silver-lo">
                  Nothing on the board for {day.long}. Message the desk — we can
                  still open a door.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Reveal className="mt-8">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            <Users size={12} className="text-flare" />
            Groups over 8, birthdays and bachelorettes are priced separately — ask
            the desk
          </p>
        </Reveal>
      </div>
    </section>
  )
}
