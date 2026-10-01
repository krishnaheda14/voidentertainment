/* --------------------------------------------------------------------------
   GET /api/view-count — Cloudflare Pages Functions only.

   Counts a page view and returns the running total. Uses the same
   CONTENT_KV namespace as save-content.js/content.js (one KV store, one
   thing to set up — see ADMIN-SETUP.md), just a different key, so there is
   nothing extra to create in the Cloudflare dashboard for this feature.

   This is a plain read-then-write, not an atomic counter — Workers KV has
   no built-in increment. Under heavy simultaneous traffic a handful of
   views can be missed if two requests read the same number before either
   writes it back. For a club's nightly traffic that's not worth the extra
   complexity of a Durable Object; if you ever need an exact count, that's
   the upgrade path.
   -------------------------------------------------------------------------- */

const VIEWS_KEY = 'views'

export async function onRequestGet({ env }) {
  if (!env.CONTENT_KV) {
    return new Response(JSON.stringify({ count: null }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const raw = await env.CONTENT_KV.get(VIEWS_KEY)
  const count = (parseInt(raw, 10) || 0) + 1
  await env.CONTENT_KV.put(VIEWS_KEY, String(count))

  return new Response(JSON.stringify({ count }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
