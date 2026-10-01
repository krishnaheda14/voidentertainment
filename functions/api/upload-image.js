import { ADMIN_HASH } from '../../src/lib/adminHash.js'

/* --------------------------------------------------------------------------
   POST /api/upload-image — Cloudflare Pages Functions version.
   Same contract as api/upload-image.js (the Vercel version): commits the
   uploaded file straight to GitHub under public/<path>, using the same
   GITHUB_TOKEN/GITHUB_REPO as save-content.js. No R2 or KV required.

   If you'd rather store images in Cloudflare R2 instead of committing them
   to git, see ADMIN-SETUP.md Part 3 — it has a drop-in replacement for the
   body of this function that uploads to an R2 bucket binding instead.
   -------------------------------------------------------------------------- */

const MAX_BYTES = 20 * 1024 * 1024 // 20MB — covers photos and a short clip

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function safePath(path) {
  if (typeof path !== 'string') return null
  const cleaned = path.replace(/^\/+/, '')
  if (!cleaned.startsWith('media/')) return null
  if (cleaned.includes('..') || cleaned.includes('\\')) return null
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(cleaned)) return null
  return cleaned
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function base64ByteLength(b64) {
  const padding = (b64.match(/=+$/) || [''])[0].length
  return Math.floor((b64.length * 3) / 4) - padding
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null)
  if (!body) return json({ error: 'Invalid JSON body' }, 400)

  const { id, password, path, contentBase64 } = body

  if (typeof id !== 'string' || typeof password !== 'string') {
    return json({ error: 'Missing id or password' }, 400)
  }
  if ((await sha256Hex(`${id}:${password}`)) !== ADMIN_HASH) {
    return json({ error: 'Wrong ID or password' }, 401)
  }

  const cleanPath = safePath(path)
  if (!cleanPath) {
    return json(
      { error: 'path must look like "media/venues/<slug>.jpg" or "media/gallery/<name>.jpg"' },
      400
    )
  }
  if (typeof contentBase64 !== 'string' || !contentBase64) {
    return json({ error: 'Missing file content' }, 400)
  }
  if (base64ByteLength(contentBase64) > MAX_BYTES) {
    return json({ error: 'File is too large — keep it under 20MB (use YouTube for longer clips)' }, 400)
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

  const fullPath = `public/${cleanPath}`
  const api = `https://api.github.com/repos/${repo}/contents/${fullPath}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'void-entertainment-admin',
  }

  try {
    let sha
    const getRes = await fetch(`${api}?ref=${branch}`, { headers })
    if (getRes.ok) {
      sha = (await getRes.json()).sha
    } else if (getRes.status !== 404) {
      const bodyText = await getRes.text()
      throw new Error(`Could not check existing file on GitHub (${getRes.status}): ${bodyText}`)
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
      const bodyText = await putRes.text()
      throw new Error(`GitHub rejected the upload (${putRes.status}): ${bodyText}`)
    }

    return json({ ok: true, path: `/${cleanPath}` })
  } catch (err) {
    return json({ error: err.message || 'Failed to upload to GitHub' }, 502)
  }
}
