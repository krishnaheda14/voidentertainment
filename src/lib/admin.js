import { useEffect, useState } from 'react'
import {
  brand as defaultBrand,
  week as defaultWeek,
  weekLabel as defaultWeekLabel,
  pastNights as defaultPastNights,
} from '../data/site'
import { ADMIN_HASH } from './adminHash'

/* --------------------------------------------------------------------------
   ADMIN GATE + LOCAL OVERRIDES + LIVE PUBLISH

   The login only unlocks /admin in this browser. Credentials are never
   stored in the code — only a SHA-256 hash of "id:password" (see
   ./adminHash.js, shared with every server function that verifies it).

   Three layers feed week/weekLabel/brand/pastNights, in priority order:
   1. localStorage override — an instant local preview, this browser only.
   2. Remote content — fetched once from /api/content. On Cloudflare Pages
      this reads a KV store that /admin writes to directly, so a publish is
      live for every visitor within seconds, no rebuild. On Vercel (or
      local dev) that endpoint doesn't exist, the fetch just 404s, and this
      layer is skipped.
   3. The bundled default — ./content.json, baked in at build time. Always
      available, which is what Vercel's GitHub-commit publish path updates
      (see api/save-content.js) and what a fresh Cloudflare KV store falls
      back to before anyone has published anything.

   See ADMIN-SETUP.md for the full publish methodology on either host.
   -------------------------------------------------------------------------- */

const SESSION_KEY = 'void.admin.session'
export const OVERRIDES_KEY = 'void.admin.overrides'

export async function checkLogin(id, password) {
  try {
    const data = new TextEncoder().encode(`${id}:${password}`)
    const buf = await crypto.subtle.digest('SHA-256', data)
    const hex = [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hex === ADMIN_HASH
  } catch {
    return false
  }
}

export function isAdmin() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdmin() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {}
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    return o && typeof o === 'object' ? o : null
  } catch {
    return null
  }
}

export function saveOverrides(obj) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(obj))
}

export function clearOverrides() {
  try {
    localStorage.removeItem(OVERRIDES_KEY)
  } catch {}
}

const CHANGE_EVENT = 'void:data-changed'

/** Call after saveOverrides()/clearOverrides() so mounted components refresh. */
export function notifyDataChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/* --------------------------------------------------------------------------
   REMOTE CONTENT — fetched once from /api/content (see functions/api/
   content.js). Only present on Cloudflare Pages once a KV namespace is
   bound; everywhere else the fetch 404s or network-errors and this stays
   null, so readWeek/readBrand/readPastNights just fall through to the
   bundled defaults below. Either way the page never blocks on this fetch —
   it renders the bundled defaults immediately, then quietly updates if a
   newer remote copy shows up a moment later.
   -------------------------------------------------------------------------- */
let remoteContent = null

if (typeof window !== 'undefined' && typeof fetch === 'function') {
  fetch('/api/content')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && typeof data === 'object') {
        remoteContent = data
        notifyDataChanged()
      }
    })
    .catch(() => {})
}

function readWeek() {
  const o = loadOverrides()
  if (o && Array.isArray(o.week)) {
    return { week: o.week, weekLabel: o.weekLabel || defaultWeekLabel }
  }
  if (remoteContent && Array.isArray(remoteContent.week)) {
    return { week: remoteContent.week, weekLabel: remoteContent.weekLabel || defaultWeekLabel }
  }
  return { week: defaultWeek, weekLabel: defaultWeekLabel }
}

function readBrand() {
  const o = loadOverrides()
  const remoteBrand = remoteContent && remoteContent.brand ? remoteContent.brand : {}
  return { ...defaultBrand, ...remoteBrand, ...(o && o.brand ? o.brand : {}) }
}

function readPastNights() {
  const o = loadOverrides()
  if (o && Array.isArray(o.pastNights)) return o.pastNights
  if (remoteContent && Array.isArray(remoteContent.pastNights)) return remoteContent.pastNights
  return defaultPastNights
}

/** Live week/weekLabel — reflects a published change or an admin's local preview. */
export function useOverridableWeek() {
  const [data, setData] = useState(readWeek)
  useEffect(() => {
    const onChange = () => setData(readWeek())
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return data
}

/** Live brand fields (WhatsApp number, hours, etc.) — same override mechanism. */
export function useOverridableBrand() {
  const [data, setData] = useState(readBrand)
  useEffect(() => {
    const onChange = () => setData(readBrand())
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return data
}

/** Live "What it looks like" gallery — same override mechanism. */
export function useOverridablePastNights() {
  const [data, setData] = useState(readPastNights)
  useEffect(() => {
    const onChange = () => setData(readPastNights())
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])
  return data
}

const DAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Throws with a readable message if the week JSON is not usable. */
export function validateWeek(week) {
  if (!Array.isArray(week) || week.length === 0) {
    throw new Error('week must be a non-empty array of day blocks')
  }
  for (const d of week) {
    if (!DAY_CODES.includes(d.day)) {
      throw new Error(`day must be one of ${DAY_CODES.join(' ')} — got "${d.day}"`)
    }
    if (typeof d.long !== 'string' || !d.long) {
      throw new Error(`"${d.day}" needs a "long" name, e.g. "Friday"`)
    }
    if (!Array.isArray(d.events)) {
      throw new Error(`"${d.day}" needs an "events" array (can be empty)`)
    }
    for (const ev of d.events) {
      if (typeof ev.title !== 'string' || typeof ev.venue !== 'string') {
        throw new Error(`every event in "${d.day}" needs "title" and "venue"`)
      }
    }
  }
}

/** Throws with a readable message if the pastNights JSON is not usable. */
export function validatePastNights(pastNights) {
  if (!Array.isArray(pastNights)) {
    throw new Error('pastNights must be an array (can be empty)')
  }
  for (const item of pastNights) {
    if (typeof item.title !== 'string' || !item.title) {
      throw new Error('every past night needs a "title"')
    }
    if (typeof item.venue !== 'string' || !item.venue) {
      throw new Error(`"${item.title}" needs a "venue"`)
    }
  }
}
