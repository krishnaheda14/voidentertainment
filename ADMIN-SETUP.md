# Admin panel — setup &amp; methodology

The site has a real admin login at **`/admin`** (not a modal — it's its own
page, so you can bookmark it or hand the link to whoever runs the schedule).
It lets you:

- Edit the weekly schedule, week label, and brand info (WhatsApp number,
  Instagram, etc.) as JSON, and publish the change live.
- Upload a venue photo or past-nights poster straight from the browser.

This document is the step-by-step for wiring the parts that need your own
credentials — GitHub token, and (optionally) Cloudflare KV/R2 if you want to
go beyond the default setup.

---

## Part 0 — How it actually works (read this first)

There is no database. Two publish paths exist, shipped and ready:

| | Where it runs | What it does |
|---|---|---|
| `api/save-content.js`, `api/upload-image.js` | Vercel (serverless functions) | Commits straight to GitHub |
| `functions/api/save-content.js`, `functions/api/upload-image.js` | Cloudflare Pages (Pages Functions) | Same thing, Cloudflare's function syntax |

Both do the identical job: verify the admin login server-side, then use the
**GitHub Contents API** to commit the change — `src/data/content.json` for
schedule/brand, `public/media/...` for photos. That git push is what
triggers your host's normal auto-deploy (Vercel or Cloudflare Pages), so the
change goes live for every visitor in about a minute. No KV, no R2, no extra
account needed beyond GitHub — **this is the part that's already built and
works today**, on whichever host you deploy to.

Cloudflare KV and R2 (Part 3 below) are an **optional upgrade**: swap the
GitHub-commit step for direct storage writes, so a save is live instantly
with no git commit and no redeploy. Use it if a 1–2 minute publish delay
actually bothers you; skip it otherwise — the default is simpler to operate
and good enough for a weekly schedule update.

---

## Part 1 — Credentials

### The admin login (ID + password)

Stored as a single SHA-256 hash in `src/lib/adminHash.js`, never the
plaintext. To set your own:

```bash
node -e "const c=require('crypto');console.log(c.createHash('sha256').update('YOUR_ID:YOUR_PASSWORD').digest('hex'))"
```

Paste the output into `src/lib/adminHash.js` as `ADMIN_HASH`, commit, push.
Both the browser login check and every server function import this same
constant, so there's exactly one place to change it.

### The GitHub token (lets the functions publish on your behalf)

1. GitHub → your avatar → **Settings** → **Developer settings** → **Personal
   access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Repository access** → **Only select repositories** → pick this repo.
3. **Permissions** → **Repository permissions** → **Contents** → **Read and
   write**. Nothing else needed.
4. Generate, copy the token now (GitHub shows it once).

You'll set this as an env var in Part 2.

---

## Part 2 — Turn on publishing (GitHub-commit path, default)

Pick whichever host you actually deploy to — you only need one.

### On Vercel

Project → **Settings** → **Environment Variables**:

| Name | Value |
|---|---|
| `GITHUB_TOKEN` | the token from Part 1 |
| `GITHUB_REPO` | `krishnaheda14/voidentertainment` |
| `GITHUB_BRANCH` | `main` (optional, this is already the default) |

Add to **Production** (and Preview, if you want `/admin` to publish from
preview deploys too). Redeploy once so the functions pick them up.

### On Cloudflare Pages

Project → **Settings** → **Environment variables** (or via Wrangler):

```bash
npx wrangler pages secret put GITHUB_TOKEN --project-name=void-entertainment
# paste the token when prompted
```

Then add `GITHUB_REPO` (and optionally `GITHUB_BRANCH`) the same way, either
via `wrangler pages secret put` or the dashboard's environment variables
screen. Redeploy once.

That's it — `/admin` now works identically on either host. **Publish live**
commits to GitHub, the host redeploys, done.

---

## Part 3 — Advanced: Cloudflare KV + R2 (instant, no git commit)

Skip this unless you specifically want saves to go live without waiting for
a redeploy. It replaces the GitHub-commit step with direct writes to
Cloudflare's own storage — only works if you're deploying on **Cloudflare
Pages** (KV/R2 bindings are a Cloudflare-specific feature, not available on
Vercel).

### 3.1 — Create a KV namespace (for schedule/brand content)

```bash
npx wrangler kv namespace create CONTENT_KV
```

This prints a `namespace id`. Bind it to the Pages project:

Project → **Settings** → **Functions** → **KV namespace bindings** → **Add
binding**: variable name `CONTENT_KV`, namespace = the one you just created.
(Or add it to `wrangler.toml` under `[[kv_namespaces]]` if you deploy via
Wrangler CLI rather than the dashboard.)

### 3.2 — Create an R2 bucket (for uploaded photos)

```bash
npx wrangler r2 bucket create void-media
```

Project → **Settings** → **Functions** → **R2 bucket bindings** → **Add
binding**: variable name `MEDIA_BUCKET`, bucket = `void-media`. Then turn on
**public access** for the bucket (R2 → your bucket → Settings → Public
access) so uploaded images are reachable by URL, and note the public base
URL it gives you (either `pub-<hash>.r2.dev` or a custom domain you attach).

### 3.3 — Swap the function bodies

Replace the GitHub-commit section of `functions/api/save-content.js` with a
KV write:

```js
// instead of the GitHub fetch/PUT block:
await env.CONTENT_KV.put('content', JSON.stringify({ weekLabel, week, brand }))
return json({ ok: true })
```

And add a matching read endpoint, `functions/api/content.js`:

```js
export async function onRequestGet({ env }) {
  const value = await env.CONTENT_KV.get('content')
  if (!value) return new Response('Not found', { status: 404 })
  return new Response(value, { headers: { 'Content-Type': 'application/json' } })
}
```

For images, replace the GitHub-commit section of
`functions/api/upload-image.js` with an R2 put:

```js
const bytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0))
await env.MEDIA_BUCKET.put(cleanPath, bytes, {
  httpMetadata: { contentType: 'image/jpeg' },
})
return json({ ok: true, path: `https://pub-<your-hash>.r2.dev/${cleanPath}` })
```

### 3.4 — Point the site at live content instead of the bundled JSON

This is the part that makes it instant: right now `src/data/site.js` imports
`content.json` at **build time**, so even a KV write needs a rebuild to show
up unless the frontend also fetches it at **runtime**. In `src/lib/admin.js`,
add a fetch of `/api/content` on load and feed its result into the same
`readWeek`/`readBrand` functions as a new base layer, underneath the
existing localStorage preview override. This is a real code change, not just
config — happy to wire it up if you decide to go this route, since it
touches how `week`/`weekLabel`/`brand` are read throughout the app.

### 3.5 — Why this repo doesn't ship with KV/R2 wired in by default

Two storage systems (GitHub commit vs. KV/R2) for the same data adds a real
architecture fork — which one is "true," what happens if they disagree,
double the moving parts to debug. The GitHub-commit path in Part 2 is
simpler to reason about, free, needs nothing beyond a token you already have
to manage, and a 1–2 minute publish delay is a non-issue for a weekly club
schedule. Reach for Part 3 only if that delay is a real problem for you.

---

## Quick reference

```
Admin URL ................. yoursite.com/admin
Change credentials ........ src/lib/adminHash.js (see Part 1)
Publish mechanism (default) GitHub Contents API commit → host auto-redeploy
Required env vars ......... GITHUB_TOKEN, GITHUB_REPO (GITHUB_BRANCH optional)
Set on Vercel .............. Project → Settings → Environment Variables
Set on Cloudflare Pages .... wrangler pages secret put, or dashboard
Advanced (optional) ....... Cloudflare KV (content) + R2 (images) — Part 3
```
