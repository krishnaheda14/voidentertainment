import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, X, MessageCircle, Instagram } from 'lucide-react'
import { brand } from '../data/site'
import logo from '../data/logo.jpg'
import { waLink, scrollToId, cx, useMediaQuery } from '../lib/utils'
import { VoidButton } from './ui'

const NAV = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'week', label: 'The week' },
  { id: 'venues', label: 'Venues' },
  { id: 'nights', label: 'Past nights' },
  { id: 'book', label: 'Book' },
]

/* ==========================================================================
   PRELOADER — the door
   Two panels held shut with a sliver of orange between them. The sliver
   widens as the counter climbs, then the panels pull apart. It is the whole
   business in one gesture: we get you past the door.
   ========================================================================== */
export function Preloader({ onDone }) {
  const [count, setCount] = useState(0)
  const [opening, setOpening] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    document.getElementById('boot')?.remove()

    if (reduce) {
      onDone?.()
      return
    }

    document.body.style.overflow = 'hidden'
    let n = 0
    const tick = setInterval(() => {
      n = Math.min(100, n + Math.random() * 13 + 4)
      setCount(Math.floor(n))
      if (n >= 100) {
        clearInterval(tick)
        setTimeout(() => setOpening(true), 260)
        setTimeout(() => {
          document.body.style.overflow = ''
          onDone?.()
        }, 1500)
      }
    }, 95)

    return () => {
      clearInterval(tick)
      document.body.style.overflow = ''
    }
  }, [onDone, reduce])

  if (reduce) return null

  const gap = 0.5 + (count / 100) * 5 // vw of orange light between the panels

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-void-000"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.5 } }}
    >
      {/* light bleeding through the crack */}
      <motion.div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2"
        animate={{ width: opening ? '100vw' : `${gap}vw` }}
        transition={{ duration: opening ? 1.1 : 0.25, ease: [0.76, 0, 0.24, 1] }}
        style={{
          background:
            'linear-gradient(90deg, transparent, #FF5A00 22%, #FFB27A 50%, #FF5A00 78%, transparent)',
          filter: 'blur(14px)',
          opacity: 0.9,
        }}
      />

      {/* the two door panels */}
      {['left', 'right'].map((side) => (
        <motion.div
          key={side}
          className={cx(
            'absolute inset-y-0 w-1/2 bg-void-000',
            side === 'left' ? 'left-0' : 'right-0'
          )}
          animate={{ x: opening ? (side === 'left' ? '-102%' : '102%') : '0%' }}
          transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }}
        >
          <div
            className={cx(
              'absolute inset-y-0 w-px bg-silver/25',
              side === 'left' ? 'right-0' : 'left-0'
            )}
          />
        </motion.div>
      ))}

      {/* counter + wordmark, riding on top until the doors move */}
      <motion.div
        className="pointer-events-none absolute inset-0 grid place-items-center"
        animate={{ opacity: opening ? 0 : 1, scale: opening ? 1.15 : 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="text-center">
          <div className="metal-flare font-display text-[clamp(3rem,14vw,9rem)] leading-none tracking-tightest">
            VOID
          </div>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            Opening the door — {String(count).padStart(3, '0')}%
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ==========================================================================
   CURSOR — desktop only, pointer:fine only
   ========================================================================== */
export function Cursor() {
  const fine = useMediaQuery('(pointer: fine)')
  const reduce = useReducedMotion()
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [hot, setHot] = useState(false)

  useEffect(() => {
    if (!fine || reduce) return
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
      const t = e.target.closest('a,button,[data-cursor]')
      setHot(Boolean(t))
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [fine, reduce])

  if (!fine || reduce) return null

  return (
    <>
      <div
        className="pointer-events-none fixed z-[95] mix-blend-difference"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%,-50%)',
        }}
      >
        <div
          className="rounded-full bg-flare transition-all duration-200"
          style={{ width: hot ? 10 : 6, height: hot ? 10 : 6 }}
        />
      </div>
      <div
        className="pointer-events-none fixed z-[94] rounded-full border border-silver/40 transition-[width,height,opacity] duration-300"
        style={{
          left: pos.x,
          top: pos.y,
          width: hot ? 46 : 26,
          height: hot ? 46 : 26,
          opacity: hot ? 0.9 : 0.4,
          transform: 'translate(-50%,-50%)',
        }}
      />
    </>
  )
}

/* ==========================================================================
   NAV
   ========================================================================== */
export function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (id) => {
    setOpen(false)
    setTimeout(() => scrollToId(id), 120)
  }

  return (
    <>
      <header
        className={cx(
          'fixed inset-x-0 top-0 z-[80] transition-all duration-500',
          solid
            ? 'border-b border-silver/10 bg-void-000/80 backdrop-blur-xl'
            : 'border-b border-transparent'
        )}
      >
        <div className="shell flex h-16 items-center justify-between sm:h-[72px]">
          <button
            onClick={() => go('top')}
            className="group flex items-center gap-2.5"
            aria-label="Void Entertainment — back to top"
          >
            <img src={logo} alt="Void Entertainment" className="h-9 w-auto sm:h-11" />
            <span className="hidden font-mono text-[9px] uppercase tracking-widest2 text-silver-lo sm:block">
              Bombay
            </span>
          </button>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className="group relative font-mono text-[11px] uppercase tracking-widest2 text-silver-mid transition-colors hover:text-silver-hi"
              >
                {n.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-flare transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <VoidButton
              href={waLink('Hi Void — I want to book a night out in Bombay.')}
              size="sm"
              variant="solid"
              className="hidden sm:inline-flex"
            >
              <MessageCircle size={13} strokeWidth={2.5} />
              WhatsApp
            </VoidButton>

            <button
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center border border-silver/15 text-silver transition-colors hover:border-flare hover:text-flare lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-void-000"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="shell flex h-16 items-center justify-between sm:h-[72px]">
              <img src={logo} alt="Void Entertainment" className="h-9 w-auto" />
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center border border-silver/15 text-silver"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
            </div>

            <div className="shell flex flex-1 flex-col justify-center">
              {NAV.map((n, i) => (
                <motion.button
                  key={n.id}
                  onClick={() => go(n.id)}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + i * 0.06, duration: 0.5 }}
                  className="group flex items-baseline justify-between border-b border-silver/10 py-5 text-left"
                >
                  <span className="metal font-display text-[clamp(2.2rem,11vw,4rem)] transition-colors duration-300 group-hover:text-flare group-hover:[-webkit-text-fill-color:currentColor]">
                    {n.label}
                  </span>
                  <span className="font-mono text-[10px] tracking-widest2 text-silver-lo">
                    0{i + 1}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="shell pb-10">
              <VoidButton
                href={waLink('Hi Void — I want to book a night out in Bombay.')}
                size="lg"
                className="w-full"
              >
                <MessageCircle size={15} strokeWidth={2.5} />
                Message the desk
              </VoidButton>
              <a
                href={brand.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo"
              >
                <Instagram size={13} /> {brand.instagramHandle}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ==========================================================================
   FLOATING WHATSAPP
   ========================================================================== */
export function WhatsAppFab() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          className="fixed bottom-5 right-5 z-[85] sm:bottom-8 sm:right-8"
        >
          <span
            className="pointer-events-none absolute inset-0 animate-ping bg-flare/30"
            aria-hidden
          />
          <a
            href={waLink('Hi Void — I want to book a night out in Bombay.')}
            target="_blank"
            rel="noreferrer noopener"
            className="relative flex items-center gap-3 bg-flare px-4 py-3.5 text-void-000 shadow-[0_0_40px_-6px_rgba(255,90,0,.75)] transition-colors hover:bg-flare-hot"
            aria-label="Message Void Entertainment on WhatsApp"
          >
            <MessageCircle size={18} strokeWidth={2.6} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest2">
              Book now
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
