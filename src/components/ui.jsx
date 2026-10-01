import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cx } from '../lib/utils'

/* -------------------------------------------------------------------------
   Reveal — scroll-triggered entrance. Respects reduced motion by rendering
   the content immediately instead of hiding it.
   ------------------------------------------------------------------------- */
export function Reveal({ children, delay = 0, y = 26, className = '', once = true }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* -------------------------------------------------------------------------
   SectionHead — eyebrow carries a real label (section name + count/meta),
   never decoration.
   ------------------------------------------------------------------------- */
export function SectionHead({ eyebrow, title, meta, children }) {
  return (
    <div className="mb-10 sm:mb-14">
      <div className="rule mb-5" />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="eyebrow mb-3 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 bg-flare" />
              {eyebrow}
            </div>
          )}
          <Reveal>
            <h2 className="metal text-[clamp(2.4rem,8.5vw,6.5rem)]">{title}</h2>
          </Reveal>
        </div>
        {meta && (
          <p className="max-w-md text-sm leading-relaxed text-silver-mid sm:text-base">
            {meta}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
   VoidButton — the orange fills from the bottom on hover, like a door light
   coming on. Renders as <a> or <button> depending on props.
   ------------------------------------------------------------------------- */
export function VoidButton({
  children,
  href,
  onClick,
  variant = 'solid',
  size = 'md',
  className = '',
  ...rest
}) {
  const base =
    'group relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden font-mono uppercase tracking-widest2 transition-colors duration-300'
  const sizes = {
    sm: 'px-4 py-2.5 text-[10px]',
    md: 'px-6 py-3.5 text-[11px]',
    lg: 'px-8 py-5 text-xs',
  }
  const variants = {
    solid: 'bg-flare text-void-000 hover:bg-flare-hot',
    ghost:
      'border border-silver/20 text-silver hover:text-void-000 hover:border-flare',
    dark: 'border border-flare/40 bg-void-100 text-flare hover:text-void-000',
  }

  const inner = (
    <>
      {variant !== 'solid' && (
        <span
          aria-hidden
          className="absolute inset-0 -z-0 origin-bottom scale-y-0 bg-flare transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
        />
      )}
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </>
  )

  const cls = cx(base, sizes[size], variants[variant], className)

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
        className={cls}
        {...rest}
      >
        {inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls} {...rest}>
      {inner}
    </button>
  )
}

/* -------------------------------------------------------------------------
   SmartImage — if the photo isn't on disk yet, we draw a deterministic
   gradient from the caption instead of showing a broken tile. The site is
   fully presentable before a single photo is uploaded.
   ------------------------------------------------------------------------- */
function hashString(s = '') {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function SmartImage({ src, alt, caption = '', className = '', imgClass = '' }) {
  const [failed, setFailed] = useState(!src)
  const h = hashString(caption || alt || src || 'void')
  const a = h % 360
  const b = (h >> 3) % 40

  if (failed) {
    return (
      <div
        className={cx(
          'relative flex items-end overflow-hidden bg-void-200',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(120% 90% at ${20 + b}% 12%, rgba(255,90,0,.42), transparent 58%),
              radial-gradient(100% 80% at 88% 92%, rgba(188,195,203,.16), transparent 60%),
              linear-gradient(${140 + a / 6}deg, #141419, #050506 70%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(244,246,248,.5) 0 1px, transparent 1px 9px)',
          }}
        />
        <span className="eyebrow relative z-10 m-4 border border-silver/15 bg-void-000/60 px-2 py-1 backdrop-blur">
          Photo pending
        </span>
      </div>
    )
  }

  return (
    <div className={cx('relative overflow-hidden bg-void-200', className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cx('h-full w-full object-cover', imgClass)}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------
   Tilt — subtle pointer-follow tilt for cards. Disabled on touch and on
   reduced motion.
   ------------------------------------------------------------------------- */
export function Tilt({ children, className = '', max = 6 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  const onMove = (e) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.transform = `perspective(1000px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`
  }
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cx('transition-transform duration-500 ease-out will-change-transform', className)}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Accordion — native <details>, so it works with zero JS and is keyboard
   and screen-reader accessible for free. Used to tuck secondary content
   (full venue list, numbers, how-it-works) behind a click so the page
   reads short by default.
   ------------------------------------------------------------------------- */
export function Accordion({ label, meta, children, className = '', defaultOpen = false }) {
  return (
    <details
      className={cx('group border border-silver/10 transition-colors hover:border-silver/25', className)}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6">
        <span>
          <span className="metal block font-display text-[clamp(1.3rem,3.4vw,1.9rem)] leading-none">
            {label}
          </span>
          {meta && (
            <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
              {meta}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="hidden font-mono text-[9px] uppercase tracking-widest2 text-silver-lo group-open:text-flare sm:inline">
            <span className="group-open:hidden">Tap to open</span>
            <span className="hidden group-open:inline">Tap to close</span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-silver/20 text-silver-lo transition-all duration-300 group-hover:border-flare group-hover:text-flare group-open:rotate-180 group-open:border-flare group-open:text-flare">
            <ChevronDown size={16} />
          </span>
        </span>
      </summary>
      <div className="border-t border-silver/10 px-6 py-8 sm:px-8">{children}</div>
    </details>
  )
}

export function StatusDot({ status }) {
  const map = {
    open: { c: 'bg-emerald-400', t: 'Open' },
    filling: { c: 'bg-flare', t: 'Filling fast' },
    closed: { c: 'bg-silver-lo', t: 'Closed' },
  }
  const s = map[status] || map.open
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-silver-mid">
      <span className={cx('h-1.5 w-1.5 rounded-full', s.c, status !== 'closed' && 'animate-blink')} />
      {s.t}
    </span>
  )
}
