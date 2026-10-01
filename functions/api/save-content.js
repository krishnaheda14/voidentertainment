import { ADMIN_HASH } from '../../src/lib/adminHash.js'

/* --------------------------------------------------------------------------
   POST /api/save-content — Cloudflare Pages Functions version.

   Same job as api/save-content.js (the Vercel version): re-verify the admin
   login server-side, then commit the edited content.json straight to GitHub
   via the Contents API. GitHub's push is what triggers Cloudflare Pages'
   normal auto-deploy — this file needs no KV or R2 to work.

   File-based routing: Cloudflare Pages turns
   functions/api/save-content.js into the route /api/save-content
   automatically — same URL the admin page calls on either host.

   Requires these on the Cloudflare Pages project (Settings → Environment
   variables, or `wrangler pages secret put`):
     GITHUB_TOKEN   — a fine-grained PAT with Contents: Read and write on this repo
     GITHUB_REPO    — "owner/repo", e.g. "krishnaheda14/voidentertainment"
     GITHUB_BRANCH  — optional, defaults to "main"

   See ADMIN-SETUP.md for the full walkthrough, including the alternative
   Cloudflare KV / R2 path for people who want to skip GitHub entirely.
   -------------------------------------------------------------------------- */

const DAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CONTENT_PATH = 'src/data/content.json'

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

  const { id, password, weekLabel, week, brand } = body

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
  try {
    validateWeek(week)
  } catch (err) {
    return json({ error: err.message }, 400)
  }

  const token = env.GITHUB_TOKEN
  const repo = env.GITHUB_REPO
  const branch = env.GITHUB_BRANCH || 'main'

  if (!token || !repo) {
    return json(
      {
        error:
          'Server is not configured to publish yet — set GITHUB_TOKEN and GITHUB_REPO on the Cloudflare Pages project.',
      },
      500
    )
  }

  const api = `https://api.github.com/repos/${repo}/contents/${CONTENT_PATH}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'void-entertainment-admin',
  }

  try {
    const getRes = await fetch(`${api}?ref=${branch}`, { headers })
    if (!getRes.ok) {
      const bodyText = await getRes.text()
      throw new Error(`Could not read current content.json from GitHub (${getRes.status}): ${bodyText}`)
    }
    const current = await getRes.json()

    const newContent = JSON.stringify({ weekLabel, week, brand }, null, 2) + '\n'

    const putRes = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Admin update via website — ${new Date().toISOString()}`,
        content: btoa(unescape(encodeURIComponent(newContent))),
        sha: current.sha,
        branch,
      }),
    })

    if (!putRes.ok) {
      const bodyText = await putRes.text()
      throw new Error(`GitHub rejected the commit (${putRes.status}): ${bodyText}`)
    }

    return json({ ok: true })
  } catch (err) {
    return json({ error: err.message || 'Failed to publish to GitHub' }, 502)
  }
}
