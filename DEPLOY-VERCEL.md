# Deploying Void Entertainment on Vercel

Complete walkthrough: the GitHub repo you already have → live on `*.vercel.app` → live on your own domain.

This project already has a Cloudflare-specific guide at `DEPLOY-CLOUDFLARE.md`. This is the same site, deployed the other way. Read whichever matches the platform you're actually using — you don't need both, and running both at once is fine too, since Vercel and Cloudflare each just watch the same GitHub repo independently.

> **Before you commit to Vercel, read Part 5.** Vercel's free "Hobby" tier is licensed for personal, non-commercial projects only. Void Entertainment is a live business, so running it there properly means the $20/month Pro plan — Cloudflare Pages' free tier has no such restriction. Nothing below stops working on Hobby, but it's not the compliant home for this specific site long-term.

---

## Part 0 — What you need

- The project folder on your computer
- Node.js 18.18+ (`node -v` to check — this machine has 24.19.0 installed)
- Git (this machine has 2.55.0)
- The GitHub repo this project already pushes to: **github.com/krishnaheda14/voidentertainment**
- A free Vercel account — [vercel.com/signup](https://vercel.com/signup), sign up with GitHub so the next step can see your repos

**Confirm the build still works locally before touching Vercel:**

```bash
cd void-entertainment
npm install
npm run build
```

You should see a `dist/` folder appear and a summary ending in `✓ built in …`. If this fails locally, it will fail on Vercel too.

---

## Part 1 — Make sure the code is actually on GitHub

If you've already run this, skip to Part 2.

```bash
git add .
git commit -m "Ready for Vercel"
git push -u origin main
```

If PowerShell says `git : The term 'git' is not recognized` — that's a stale PATH from installing Git recently, not a broken install. Fully close and reopen your terminal (or VS Code, if this is its integrated terminal) and try again. If you don't want to restart anything right now, run it with the full path instead:

```powershell
& "C:\Program Files\Git\cmd\git.exe" push -u origin main
```

Either way, it'll prompt you to sign into GitHub the first time.

---

## Part 2 — Import the project into Vercel

1. Sign in at **[vercel.com](https://vercel.com)** with GitHub.
2. **Add New… → Project.**
3. **Import Git Repository** → find `voidentertainment` → **Import**. On GitHub's permission screen, choose **Only select repositories** and pick this one specifically, rather than granting access to everything.
4. Leave the configuration screen alone — Vercel fingerprints Vite projects automatically:

   | Field | Auto-filled value |
   |---|---|
   | Framework preset | `Vite` |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Install command | `npm install` |
   | Environment variables | none needed to go live — only needed for the admin panel's "Publish live" button, see Part 3.5 |

5. **Deploy.** The build log streams live; first build takes 1–2 minutes.

When it finishes you get a URL: **`https://voidentertainment.vercel.app`** (or with random characters appended, if that exact name is taken). Open it on your phone and tap **Message the desk** — it should open WhatsApp with the real number, `+91 94201 69352`.

---

## Part 3 — Keep deep links from 404ing

Cloudflare gets this from `public/_redirects`, which already ships with this repo. Vercel's equivalent is `vercel.json`, which is **also already in this repo root**:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This site is single-page (everything scrolls on one URL), so it's mostly future-proofing — but it means any link that ever points at a path other than `/` still resolves instead of 404ing.

---

## Part 3.5 — Turn on the admin panel's "Publish live" button

The lock icon in the nav opens an admin panel (login form + a JSON editor for the weekly schedule and brand info). Saving there always previews instantly in that one browser. To make **Publish live** actually push the change to the real site for every visitor, it needs a small serverless function (`api/save-content.js`, already in this repo) that commits `src/data/content.json` to GitHub on your behalf — that commit is what triggers the normal Vercel rebuild.

1. **Create a GitHub token.** GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token.
   - Repository access: **Only select repositories** → `voidentertainment`.
   - Permissions → **Contents: Read and write**. Nothing else needed.
   - Copy the token now — GitHub only shows it once.
2. **Add env vars in Vercel.** Project → Settings → Environment Variables:

   | Name | Value |
   |---|---|
   | `GITHUB_TOKEN` | the token from step 1 |
   | `GITHUB_REPO` | `krishnaheda14/voidentertainment` |
   | `GITHUB_BRANCH` | `main` (optional — this is already the default) |

   Add them to **Production** (and Preview, if you want it to work on preview deploys too).
3. **Redeploy** once (Deployments → ⋯ → Redeploy) so the function picks up the new env vars.

Without this, **Publish live** returns "Server is not configured to publish yet" — the local preview still works fine, it just won't reach GitHub.

The credentials for the admin panel itself (the ID/password behind the lock icon) are set separately, as a hash in `src/lib/adminHash.js` — see the comment at the top of that file to change them.

---

## Part 4 — Pin the Node version

Vercel's default drifts over time the same way Cloudflare's does. Set it explicitly:

**Project → Settings → General → Node.js Version** → `20.x` or newer.

---

## Part 5 — Hobby vs. Pro (read this before you rely on this deployment)

| | Vercel Hobby (free) | Vercel Pro |
|---|---|---|
| Cost | ₹0 | ~$20/month |
| Bandwidth | 100 GB/month | Higher, metered |
| Commercial / business use | **Not permitted** — Hobby's terms restrict it to personal, non-commercial projects | Allowed |
| Preview URL per branch/PR | Yes | Yes |

Void Entertainment takes bookings and generates revenue, which is exactly the case Hobby's terms exclude. This doesn't block anything technically — the steps above work identically on either plan — but if this deployment is going to be the real production site rather than a staging copy, budget for Pro. Cloudflare Pages (`DEPLOY-CLOUDFLARE.md`) has no equivalent restriction on its free tier, which is why that guide is the primary one for this project.

---

## Part 6 — Putting it on your own domain

Same domain, either platform — just don't point it at both at once.

1. **Project → Settings → Domains → Add.**
2. Enter `voidentertainment.in`. Vercel shows the exact records to create.
3. At your domain's DNS host, add:

   | Type | Host | Value |
   |---|---|---|
   | A | `@` (apex) | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   Or skip the individual records and delegate the domain's nameservers to Vercel entirely — Vercel offers both options when you add the domain.
4. Wait for **Valid Configuration** in the dashboard. The SSL certificate issues automatically once it shows that.

> **If this domain's DNS already lives on Cloudflare** (for instance, because you set up Route A first, or Cloudflare handles email for it): the A/CNAME records above must be set to **DNS only** — a grey cloud, not orange — in the Cloudflare dashboard. Leaving them proxied puts Cloudflare's edge in front of Vercel's, which breaks certificate issuance and can loop redirects.

**Four places to update once the domain is real**, same list as the Cloudflare guide:

- `src/data/site.js` → `brand.domain`
- `index.html` → the canonical link, `og:url`, and both image URLs
- `public/robots.txt` → the `Sitemap:` line
- `public/sitemap.xml` → the `<loc>` value

Then `git push` and it redeploys under the real name.

---

## Part 7 — Day to day

```bash
git add .
git commit -m "Week of 7 September"
git push
```

Vercel rebuilds and publishes automatically, usually inside a minute.

| | |
|---|---|
| Roll back a bad deploy | Project → **Deployments** → pick a prior one → **Promote to Production** |
| Check next week before it's live | Push to any other branch, or open a PR — Vercel builds a private preview URL automatically, no setup needed |
| Traffic | Project → **Analytics** |

### CLI alternative, no dashboard needed

Already wired into `package.json`:

```bash
npm run vercel:login   # once
npm run deploy:vercel  # every time after — builds and promotes to production
```

---

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| Build fails: `Cannot find module` | `package.json` wasn't committed, or `node_modules` was. Check the GitHub repo directly. |
| Build succeeds, page is blank white | Output directory isn't exactly `dist`. |
| Works locally, fails on Vercel | Node version mismatch — set it under Part 4. |
| Domain stuck on "Invalid Configuration" | DNS hasn't propagated yet, or (if DNS is on Cloudflare) the record is still proxied orange instead of DNS-only. |
| Certificate won't issue / redirect loop | Almost always the Cloudflare grey-cloud issue above. |
| `git` not recognized in PowerShell | Stale PATH — see Part 1. |
| WhatsApp button opens the wrong chat | `brand.whatsapp` in `src/data/site.js`. |
| Old version keeps showing | Every Vercel deploy invalidates the edge cache automatically — hard refresh (`Ctrl/Cmd + Shift + R`) first, it shouldn't need more than that. |

---

## Quick reference

```
Build command ............ npm run build
Output directory ......... dist
Node version .............. 20.x+ (set in Project → Settings → General)
Production branch ........ main
SPA routing ............... handled by vercel.json (already in this repo)
Commercial use ............ requires Pro — see Part 5
Update the site ........... git push
                             npm run deploy:vercel   (CLI alternative)
```
