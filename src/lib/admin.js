import { useEffect, useState } from 'react'
import { brand as defaultBrand, week as defaultWeek, weekLabel as defaultWeekLabel } from '../data/site'

/* --------------------------------------------------------------------------
   ADMIN GATE + LOCAL OVERRIDES

   This is a static site with no server, so "admin" works like this:
   - The login only unlocks the editing panel in this browser. Credentials are
     never stored in the code — only a SHA-256 hash of "id:password".
   - Saved changes live in this browser's localStorage and override the
     defaults from src/data/site.js on load. They are a live preview for the
     admin; other visitors do not see them until the exported JSON is pasted
     back into src/data/site.js and the site is redeployed.

   To change the credentials, run:
     node -e "const c=require('crypto');console.log(c.createHash('sha256').update('NEW_ID:NEW_PASSWORD').digest('hex'))"
   and replace ADMIN_HASH with the output.
   -------------------------------------------------------------------------- */

const ADMIN_HASH =
  '409bf2bfee78c822ed5acfe9c4557334f0ce744daef0bf01c1d847fc06cfc1f1'

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

function readWeek() {
  const o = loadOverrides()
  if (o && Array.isArray(o.week)) {
    return { week: o.week, weekLabel: o.weekLabel || defaultWeekLabel }
  }
  return { week: defaultWeek, weekLabel: defaultWeekLabel }
}

function readBrand() {
  const o = loadOverrides()
  return { ...defaultBrand, ...(o && o.brand ? o.brand : {}) }
}

/** Live week/weekLabel — reflects an admin's saved overrides in this browser. */
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
