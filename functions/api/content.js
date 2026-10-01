/* --------------------------------------------------------------------------
   GET /api/content — Cloudflare Pages Functions only.

   Returns whatever the admin panel last published to the CONTENT_KV
   namespace (see save-content.js). The site fetches this once on load
   (src/lib/admin.js) and uses it in place of the bundled src/data/
   content.json when present, so a publish is live within seconds.

   If no KV namespace is bound yet, or nothing has been published yet,
   this 404s and the site just keeps using the bundled defaults — nothing
   breaks, it simply means "no live override yet."
   -------------------------------------------------------------------------- */

export async function onRequestGet({ env }) {
  if (!env.CONTENT_KV) {
    return new Response('CONTENT_KV not bound', { status: 404 })
  }

  const value = await env.CONTENT_KV.get('content')
  if (!value) {
    return new Response('Nothing published yet', { status: 404 })
  }

  return new Response(value, {
    headers: {
      'Content-Type': 'application/json',
      // Short cache — publishing should feel near-instant, not stuck behind
      // a stale edge cache, but this still saves a KV read on rapid repeat
      // visits (e.g. someone refreshing right after a publish).
      'Cache-Control': 'public, max-age=15',
    },
  })
}
