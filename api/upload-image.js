import { createHash } from 'node:crypto'
import { ADMIN_HASH } from '../src/lib/adminHash.js'

/* --------------------------------------------------------------------------
   POST /api/upload-image
   Body: { id, password, path, contentBase64 }

   `path` is relative to /public, e.g. "media/venues/mercii.jpg" or
   "media/gallery/nye-2026.jpg" — exactly the paths venues/pastNights
   already expect in src/data/site.js, so uploading through the admin
   page is enough; nothing else needs to change for the photo to appear.

   Commits the file straight to GitHub (same GITHUB_TOKEN/GITHUB_REPO env
   vars as api/save-content.js), which is what triggers Vercel's redeploy.
   -------------------------------------------------------------------------- */

const MAX_BYTES = 8 * 1024 * 1024 // 8MB — plenty for a compressed JPG/PNG

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex')
}

// Keeps uploads inside public/media/** — no path traversal, no overwriting
// app source by pointing this at something like "../../src/App.jsx".
function safePath(path) {
  if (typeof path !== 'string') return null
  const cleaned = path.replace(/^\/+/, '')
  if (!cleaned.startsWith('media/')) return null
  if (cleaned.includes('..') || cleaned.includes('\\')) return null
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(cleaned)) return null
  return cleaned
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { id, password, path, contentBase64 } = req.body || {}

  if (typeof id !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Missing id or password' })
    return
  }
  if (sha256Hex(`${id}:${password}`) !== ADMIN_HASH) {
    res.status(401).json({ error: 'Wrong ID or password' })
    return
  }

  const cleanPath = safePath(path)
  if (!cleanPath) {
    res.status(400).json({
      error: 'path must look like "media/venues/<slug>.jpg" or "media/gallery/<name>.jpg"',
    })
    return
  }
  if (typeof contentBase64 !== 'string' || !contentBase64) {
    res.status(400).json({ error: 'Missing file content' })
    return
  }
  if (Buffer.byteLength(contentBase64, 'base64') > MAX_BYTES) {
    res.status(400).json({ error: 'File is too large — keep it under 8MB' })
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

  const fullPath = `public/${cleanPath}`
  const api = `https://api.github.com/repos/${repo}/contents/${fullPath}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    // Look up the existing file's sha (if any) — GitHub requires it to
    // overwrite a file, and rejects it when creating a brand new one.
    let sha
    const getRes = await fetch(`${api}?ref=${branch}`, { headers })
    if (getRes.ok) {
      sha = (await getRes.json()).sha
    } else if (getRes.status !== 404) {
      const body = await getRes.text()
      throw new Error(`Could not check existing file on GitHub (${getRes.status}): ${body}`)
    }

    const putRes = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Admin upload via website — ${cleanPath}`,
        content: contentBase64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    })

    if (!putRes.ok) {
      const body = await putRes.text()
      throw new Error(`GitHub rejected the upload (${putRes.status}): ${body}`)
    }

    res.status(200).json({ ok: true, path: `/${cleanPath}` })
  } catch (err) {
    res.status(502).json({ error: err.message || 'Failed to upload to GitHub' })
  }
}
