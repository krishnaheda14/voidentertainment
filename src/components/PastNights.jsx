import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, X, Instagram } from 'lucide-react'
import { brand } from '../data/site'
import { cx, parseYouTubeId } from '../lib/utils'
import { useOverridablePastNights } from '../lib/admin'
import { Reveal, SectionHead, SmartImage, VoidButton } from './ui'

const SPAN = {
  wide: 'sm:col-span-2 aspect-[16/10]',
  tall: 'sm:row-span-2 aspect-[3/4] sm:aspect-auto',
  normal: 'aspect-[4/3]',
}

function Lightbox({ item, onClose }) {
  const onKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onKey])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} at ${item.venue}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] grid place-items-center bg-void-000/95 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video w-full overflow-hidden border border-silver/15 bg-void-100">
          {item.youtube ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${parseYouTubeId(item.youtube)}?autoplay=1&rel=0&modestbranding=1`}
              title={`${item.title} — ${item.venue}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : item.video ? (
            <video
              className="h-full w-full object-cover"
              src={item.video}
              poster={item.poster}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <SmartImage
              src={item.poster}
              alt={`${item.title} at ${item.venue}`}
              caption={item.title}
              className="h-full w-full"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h3 className="metal font-display text-2xl sm:text-3xl">{item.title}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
              {item.venue} · {item.meta}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 border border-silver/20 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest2 text-silver transition-colors hover:border-flare hover:text-flare"
          >
            <X size={13} /> Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PastNights() {
  const [open, setOpen] = useState(null)
  const pastNights = useOverridablePastNights()

  return (
    <section id="nights" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow={`Past nights · ${pastNights.length} in the reel`}
          title="What it looks like"
          meta="Aftermovies and floor shots from rooms we filled. If a night you are planning is in here, ask for the same setup — we still have the run sheet."
        />

        <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-3">
          {pastNights.map((item, i) => {
            const playable = Boolean(item.youtube || item.video)
            return (
              <Reveal
                key={item.title}
                delay={i * 0.05}
                className={cx(SPAN[item.span] || SPAN.normal, 'min-h-[220px]')}
              >
                <button
                  onClick={() => setOpen(item)}
                  className="group relative block h-full w-full overflow-hidden border border-silver/10 text-left"
                  data-cursor
                  aria-label={`Open ${item.title} at ${item.venue}`}
                >
                  <SmartImage
                    src={item.poster}
                    alt={`${item.title} at ${item.venue}`}
                    caption={item.title}
                    className="absolute inset-0 h-full w-full"
                    imgClass="transition-transform duration-[1.4s] ease-out group-hover:scale-[1.08]"
                  />

                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-000 via-void-000/20 to-transparent" />
                  <span className="pointer-events-none absolute inset-0 bg-flare/0 transition-colors duration-500 group-hover:bg-flare/10" />

                  {playable && (
                    <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-silver/30 bg-void-000/50 backdrop-blur transition-all duration-500 group-hover:scale-110 group-hover:border-flare group-hover:bg-flare group-hover:text-void-000">
                      <Play size={18} fill="currentColor" />
                    </span>
                  )}

                  <span className="absolute inset-x-0 bottom-0 p-5">
                    <span className="block font-display text-xl uppercase text-silver-hi sm:text-2xl">
                      {item.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
                      <span className="text-flare">{item.venue}</span>
                      <span>{item.meta}</span>
                    </span>
                  </span>
                </button>
              </Reveal>
            )
          })}
        </div>

        <Reveal className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border border-silver/10 p-6 sm:p-8">
            <p className="max-w-lg text-[15px] leading-relaxed text-silver-mid">
              Everything goes up on Instagram the morning after. Follow to see
              which rooms are actually full before you commit to one.
            </p>
            <VoidButton href={brand.instagram} variant="ghost">
              <Instagram size={14} />
              {brand.instagramHandle}
            </VoidButton>
          </div>
        </Reveal>
      </div>

      <AnimatePresence>
        {open && <Lightbox item={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  )
}
