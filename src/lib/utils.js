import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { brand } from '../data/site'

/* --------------------------------------------------------------------------
   WHATSAPP
   Builds a wa.me deep link with the message pre-typed. Works on phone and on
   WhatsApp Web, which is why we use wa.me and not the api.whatsapp.com form.
   -------------------------------------------------------------------------- */
export function waLink(message = '') {
  const number = String(brand.whatsapp).replace(/\D/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function waBooking({ venue, night, title } = {}) {
  const lines = ['Hi Team Void — I want to book through you.']
  if (venue) lines.push(`Venue: ${venue}`)
  if (night) lines.push(`Night: ${night}`)
  if (title) lines.push(`Event: ${title}`)
  lines.push('Headcount: ', 'Date: ', 'Table or guestlist: ')
  return waLink(lines.join('\n'))
}

/* --------------------------------------------------------------------------
   IST CLOCK
   The site runs on Mumbai time regardless of the visitor's device clock,
   so "tonight" always means tonight here.
   -------------------------------------------------------------------------- */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function istParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  )
  const hour = Number(parts.hour) % 24
  const minute = Number(parts.minute)
  const second = Number(parts.second)
  return {
    day: parts.weekday, // 'Mon' … 'Sun'
    hour,
    minute,
    second,
    clock: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    minutesOfDay: hour * 60 + minute,
    secondsOfDay: hour * 3600 + minute * 60 + second,
  }
}

/** Nightlife day: anything before 06:00 IST still belongs to the night before. */
export function nightlifeDay(p = istParts()) {
  if (p.hour < 6) {
    const i = DAYS.indexOf(p.day)
    return DAYS[(i + 6) % 7]
  }
  return p.day
}

export function useIST(tickMs = 1000) {
  const [now, setNow] = useState(() => istParts())
  useEffect(() => {
    const id = setInterval(() => setNow(istParts()), tickMs)
    return () => clearInterval(id)
  }, [tickMs])
  return now
}

/** Time remaining until an "HH:MM" door time, in IST. */
export function timeToDoor(doorHHMM, now = istParts()) {
  const [h, m] = String(doorHHMM).split(':').map(Number)
  const doorSec = h * 3600 + m * 60
  let diff = doorSec - now.secondsOfDay
  if (diff <= 0) return { open: true, label: 'Doors open' }
  const hh = Math.floor(diff / 3600)
  const mm = Math.floor((diff % 3600) / 60)
  const ss = diff % 60
  return {
    open: false,
    label: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
  }
}

/* --------------------------------------------------------------------------
   SMOOTH SCROLL
   Lenis, with a hard opt-out when the OS asks for reduced motion.
   -------------------------------------------------------------------------- */
export function useSmoothScroll() {
  const ref = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    ref.current = lenis
    window.__lenis = lenis

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      delete window.__lenis
      ref.current = null
    }
  }, [])
  return ref
}

/** Scroll to an element id, going through Lenis when it is running. */
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -72 })
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

export const cx = (...a) => a.filter(Boolean).join(' ')
