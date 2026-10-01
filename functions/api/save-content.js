import { ADMIN_HASH } from '../../src/lib/adminHash.js'

/* --------------------------------------------------------------------------
   POST /api/save-content — Cloudflare Pages Functions version.
   Body: { id, password, weekLabel, week, brand, pastNights }

   Unlike the Vercel version (api/save-content.js, which commits to
   GitHub), this one writes straight to a Cloudflare KV namespace. That
   means a publish is live for every visitor within seconds — no git
   commit, no rebuild. functions/api/content.js is the matching read side
   that the site fetches on load (see src/lib/admin.js).

   Requires a KV namespace bound as CONTENT_KV on the Cloudflare Pages
   project (Settings → Functions → KV namespace bindings). See
   ADMIN-SETUP.md for the exact clicks.
   -------------------------------------------------------------------------- */

const DAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CONTENT_KEY = 'content'

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function validateWeek(week) {
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null)
  if (!body) return json({ error: 'Invalid JSON body' }, 400)

  const { id, password, weekLabel, week, brand, pastNights } = body

  if (typeof id !== 'string' || typeof password !== 'string') {
    return json({ error: 'Missing id or password' }, 400)
  }
  if ((await sha256Hex(`${id}:${password}`)) !== ADMIN_HASH) {
    return json({ error: 'Wrong ID or password' }, 401)
  }

  if (typeof weekLabel !== 'string' || !weekLabel) {
    return json({ error: 'weekLabel must be a non-empty string' }, 400)
  }
  if (!brand || typeof brand !== 'object' || Array.isArray(brand)) {
    return json({ error: 'brand must be an object' }, 400)
  }
  if (!Array.isArray(pastNights)) {
    return json({ error: 'pastNights must be an array (can be empty)' }, 400)
  }
  try {
    validateWeek(week)
  } catch (err) {
    return json({ error: err.message }, 400)
  }

  if (!env.CONTENT_KV) {
    return json(
      {
        error:
          'Server is not configured to publish yet — bind a KV namespace as CONTENT_KV on the Cloudflare Pages project.',
      },
      500
    )
  }

  try {
    await env.CONTENT_KV.put(CONTENT_KEY, JSON.stringify({ weekLabel, week, brand, pastNights }))
    return json({ ok: true })
  } catch (err) {
    return json({ error: err.message || 'Failed to save to KV' }, 502)
  }
}
