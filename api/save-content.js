import { createHash } from 'node:crypto'
import { ADMIN_HASH } from '../src/lib/adminHash.js'

/* --------------------------------------------------------------------------
   POST /api/save-content
   Body: { id, password, weekLabel, week, brand }

   Verifies the same id/password the admin panel logged in with (server-side,
   so the write can't be forged just by knowing the client-side session flag),
   then commits the new content.json straight to GitHub via the Contents API.
   That push is what triggers Vercel's normal auto-deploy.

   Requires these env vars on the Vercel project:
     GITHUB_TOKEN   — a fine-grained PAT with Contents: Read and write on this repo
     GITHUB_REPO    — "owner/repo", e.g. "krishnaheda14/voidentertainment"
     GITHUB_BRANCH  — optional, defaults to "main"
   -------------------------------------------------------------------------- */

const DAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CONTENT_PATH = 'src/data/content.json'

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex')
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { id, password, weekLabel, week, brand } = req.body || {}

  if (typeof id !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Missing id or password' })
    return
  }
  if (sha256Hex(`${id}:${password}`) !== ADMIN_HASH) {
    res.status(401).json({ error: 'Wrong ID or password' })
    return
  }

  if (typeof weekLabel !== 'string' || !weekLabel) {
    res.status(400).json({ error: 'weekLabel must be a non-empty string' })
    return
  }
  if (!brand || typeof brand !== 'object' || Array.isArray(brand)) {
    res.status(400).json({ error: 'brand must be an object' })
    return
  }
  try {
    validateWeek(week)
  } catch (err) {
    res.status(400).json({ error: err.message })
    return
  }

  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'

  if (!token || !repo) {
    res.status(500).json({
      error:
        'Server is not configured to publish yet — set GITHUB_TOKEN and GITHUB_REPO in the Vercel project env vars.',
    })
    return
  }

  const api = `https://api.github.com/repos/${repo}/contents/${CONTENT_PATH}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    const getRes = await fetch(`${api}?ref=${branch}`, { headers })
    if (!getRes.ok) {
      const body = await getRes.text()
      throw new Error(`Could not read current content.json from GitHub (${getRes.status}): ${body}`)
    }
    const current = await getRes.json()

    const newContent = JSON.stringify({ weekLabel, week, brand }, null, 2) + '\n'

    const putRes = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Admin update via website — ${new Date().toISOString()}`,
        content: Buffer.from(newContent, 'utf-8').toString('base64'),
        sha: current.sha,
        branch,
      }),
    })

    if (!putRes.ok) {
      const body = await putRes.text()
      throw new Error(`GitHub rejected the commit (${putRes.status}): ${body}`)
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: err.message || 'Failed to publish to GitHub' })
  }
}
