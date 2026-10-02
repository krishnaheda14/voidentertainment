# Deploying Void Entertainment on Cloudflare

Complete walkthrough: local machine → live on `*.pages.dev` → live on your own domain.

Cloudflare Pages is free for this site. No credit card, unlimited bandwidth, and it serves from a data centre in Mumbai so it will load fast for your actual customers.

> **A note on the dashboard.** Cloudflare has been folding Pages into Workers, so labels move around. If you see **"Import a repository"** or **"Workers Builds"** where this guide says something slightly different, it is the same flow — the build command and output directory below are what matter. Cloudflare now nudges new projects toward Workers, but Pages remains the simplest correct choice for a static site like this one and is fully supported.

---

## Part 0 — What you need

- The project folder on your computer
- Node.js 18.18+ (`node -v` to check — this was built on Node 22)
- A free Cloudflare account — [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
- For Method A only: a free GitHub account

**Before anything else, confirm the build works locally:**

```bash
cd void-entertainment
npm install
npm run build
```

You should see a `dist/` folder appear and a summary ending in `✓ built in …`. If that fails locally it will fail on Cloudflare too, so fix it here first.

---

# Method A — GitHub + Cloudflare Pages (recommended)

Takes ten minutes to set up once. After that, every schedule update is `git push` and the site republishes itself. **This is the one you want.**

## A1. Put the code on GitHub

Install Git if you do not have it ([git-scm.com](https://git-scm.com/downloads)), then:

```bash
cd void-entertainment
git init
git add .
git commit -m "Void Entertainment website"
```

Create an empty repository at **[repo.new](https://repo.new)**. Name it `void-entertainment`. **Do not** tick "Add a README" — the repo must be empty. Private is fine; Cloudflare can read private repos.

GitHub then shows you a URL. Use it:

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/void-entertainment.git
git push -u origin main
```

Refresh the GitHub page — your files should be there. `node_modules` and `dist` are correctly excluded by `.gitignore`; that is expected, Cloudflare builds them itself.

## A2. Create the Pages project

1. Sign in at **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. In the left sidebar, click **Workers & Pages**
3. Click **Create application**
4. Select the **Pages** tab
5. Click **Connect to Git** (may read *Import an existing Git repository*)
6. Click **Connect GitHub**, authorise Cloudflare
   - On the GitHub permission screen, choose **Only select repositories** and pick `void-entertainment`. Do not grant access to everything.
7. Back on Cloudflare, select `void-entertainment` and click **Begin setup**

## A3. Build settings — get these exactly right

| Field | Value |
|---|---|
| **Project name** | `void-entertainment` (this becomes `void-entertainment.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | leave blank |

Then expand **Environment variables (advanced)** and add one:

| Variable name | Value |
|---|---|
| `NODE_VERSION` | `22` |

This one matters. Cloudflare's default Node version drifts, and pinning it means a build that works today still works in six months. Add it to the **Production** environment; add it to Preview too if the form offers both.

Click **Save and Deploy**.

## A4. Watch it build

You will see a live log. It runs `npm install`, then `npm run build`, then uploads `dist`. First build takes 1–3 minutes.

When it finishes you get a URL: **`https://void-entertainment.pages.dev`**

Open it on your phone. **Tap the floating orange "Book now" button** — it must open WhatsApp with your real number and a pre-typed message. If it opens the wrong number, fix `brand.whatsapp` in `src/data/site.js`, commit, push, and it redeploys.

## A5. From now on

```bash
git add .
git commit -m "Week of 7 September"
git push
```

That is the whole deployment process forever. Cloudflare rebuilds on every push to `main`.

**Bonus:** push to any other branch and Cloudflare gives you a private preview URL for that branch, so you can check next week's schedule before it goes live.

---

# Method B — Wrangler CLI (no GitHub)

Good if you would rather not use Git. You must run these commands from your own machine every time you want to publish.

```bash
cd void-entertainment
npx wrangler login          # opens a browser, click Allow
npm run build
npx wrangler pages deploy dist --project-name=YOUR-PROJECT-NAME
```

First run asks you to create the project and pick a production branch — type `main`. Whatever name you give it there is final — Cloudflare Pages doesn't let you rename a project's deploy target later, so if you want it to match this guide exactly, type `void-entertainment`.

After that, one command publishes:

```bash
npm run deploy              # this is the build + deploy shortcut, already in package.json
```

`wrangler.toml` and `package.json`'s `deploy`/`cf:tail` scripts already declare the project name — update both if yours differs from the default. **This specific project's live Cloudflare Pages project is named `voidentertainmentmumbai`** (not `void-entertainment`) — that's what every script and workflow in this repo currently points at.

`wrangler.toml` in the project root already declares `pages_build_output_dir = "dist"`.

---

# Method C — Drag and drop (fastest, least convenient)

For a one-off demo.

1. `npm run build` on your machine
2. **Workers & Pages → Create application → Pages → Upload assets**
3. Name it `void-entertainment`
4. Drag the **`dist` folder** onto the upload area — the folder itself, not its contents, and not the whole project
5. **Deploy site**

Every future update means repeating all five steps. Move to Method A when you can.

---

# Part 2 — Putting it on your own domain

## B1. Buying the domain

**Easiest: buy it from Cloudflare.** Dashboard → **Domain Registration → Register Domain**. Cloudflare sells at cost with no markup and no renewal price jump, and the domain lands in your account already configured — you skip the whole nameserver step below. For `.in` domains this is usually around ₹800–1,200/year.

**If you buy elsewhere** (GoDaddy, Namecheap, BigRock, Hostinger): fine, but you must move DNS to Cloudflare in step B2. Ignore any hosting, "website builder", email or SSL upsell at checkout — you need the domain and nothing else. Cloudflare provides the hosting and the SSL certificate for free.

Pick something short and sayable — people will be typing it from an Instagram bio on a phone. `voidentertainment.in` or `voidbombay.com`.

## B2. Point the domain at Cloudflare

**Skip this entire step if you bought the domain from Cloudflare.**

> ⚠️ **First, if your registrar has DNSSEC switched on, turn it off before you change nameservers.** Changing nameservers with DNSSEC still active can take your domain offline for hours. You can re-enable it from Cloudflare once the domain is active.

1. Cloudflare dashboard → **Add a site** (or **+ Add → Existing domain**)
2. Type your domain, e.g. `voidentertainment.in`, and continue
3. Choose the **Free** plan
4. Cloudflare scans your existing DNS records — for a brand-new domain there will be nothing meaningful. Continue.
5. Cloudflare shows you **two nameservers**, something like:

   ```
   arnold.ns.cloudflare.com
   pola.ns.cloudflare.com
   ```

   Yours will be different. Copy them exactly.

6. Go to your registrar's control panel, find **Nameservers** (sometimes under DNS, "Custom DNS", or "Manage DNS"), switch from the default to **Custom**, and paste in Cloudflare's two. **Delete any other nameserver entries** — only Cloudflare's two should remain.

   - GoDaddy: My Products → Domain → **DNS → Nameservers → Change → I'll use my own**
   - Namecheap: Domain List → Manage → **Nameservers → Custom DNS**
   - BigRock / ResellerClub: Manage Order → **Name Servers**
   - Hostinger: Domains → Manage → **DNS / Nameservers → Change nameservers**

7. Back on Cloudflare, click **Continue** / **Check nameservers now**

Propagation usually takes 5–30 minutes and occasionally up to 24 hours. Cloudflare emails you when the domain goes **Active**. Wait for that email before continuing.

## B3. Attach the domain to your site

1. **Workers & Pages** → click your Pages project (`void-entertainment` in this guide — check your actual project name if you renamed it or Cloudflare picked a different one for you)
2. **Custom domains** tab
3. **Set up a custom domain**
4. Enter your apex domain — `voidentertainment.in`, with no `www` and no `https://`
5. **Continue** → **Activate domain**

Cloudflare creates the DNS record for you. You do not add it by hand.

Because an apex domain cannot normally hold a CNAME, Cloudflare uses CNAME flattening behind the scenes — this is the reason the domain must be a zone on the same Cloudflare account as the Pages project. If Cloudflare says the domain is not in your account, step B2 has not finished.

Now repeat steps 3–5 for **`www.voidentertainment.in`** so both spellings work.

Status goes **Pending → Active**, normally within a few minutes; the SSL certificate is issued automatically in the same window. If it sits on Pending past 15 minutes, see the troubleshooting table.

## B4. Lock down HTTPS

In the dashboard, select your **domain** (not the Pages project) and go to **SSL/TLS**:

- **Overview → Encryption mode: Full (strict)**
- **Edge Certificates → Always Use HTTPS: On**
- **Edge Certificates → Automatic HTTPS Rewrites: On**
- **Edge Certificates → Minimum TLS Version: TLS 1.2**

Full (strict) is the correct setting for Pages. Do not use Flexible — it causes redirect loops.

## B5. Send www to the apex

You want one canonical address, otherwise Google indexes both and your analytics split in two.

Domain → **Rules → Redirect Rules → Create rule**:

- **Rule name:** `www to apex`
- **If** → Custom filter expression → Field `Hostname`, Operator `equals`, Value `www.voidentertainment.in`
- **Then** → Type: **Dynamic**
- **Expression:** `concat("https://voidentertainment.in", http.request.uri.path)`
- **Status code:** `301`
- Tick **Preserve query string**

Deploy. Now `www.voidentertainment.in/anything` lands on `voidentertainment.in/anything`.

## B6. Update the domain inside the code

Four places still say `voidentertainment.in`. Change them to your real domain:

1. `src/data/site.js` → `brand.domain`
2. `index.html` → the `<link rel="canonical">`, the `og:url`, and both image URLs
3. `public/robots.txt` → the `Sitemap:` line
4. `public/sitemap.xml` → the `<loc>` value

Then `git push` (Method A) or `npm run deploy` (Method B).

**While you are there:** create a 1200×630 px JPG of the site's hero, save it as `public/og.jpg`, and every WhatsApp and Instagram share of your link will show that image instead of a blank card. For a business that lives on link shares, this is worth twenty minutes.

---

# Part 3 — Running it day to day

### Rolling back a bad deploy

Pages project → **Deployments** → find the last good one → **⋯ → Rollback to this deployment**. Live again in seconds. This is why Method A is worth the setup — you always have a working version one click away.

### Clearing the cache

Text and layout changes appear immediately (build assets are content-hashed). If you overwrite a photo with the *same filename* and still see the old one: domain → **Caching → Configuration → Purge Everything**.

### Seeing your traffic

Pages project → **Analytics**, or domain → **Analytics**. Free, no cookie banner needed, no script to add.

### Getting email on the domain

Domain → **Email → Email Routing**. Free forwarding — `book@voidentertainment.in` lands in your existing Gmail. Cloudflare adds the MX records for you.

### Costs

| Item | Cost |
|---|---|
| Cloudflare Pages hosting | ₹0 |
| Bandwidth | ₹0, unlimited |
| SSL certificate | ₹0 |
| Analytics + email forwarding | ₹0 |
| Domain | ~₹900–1,500/year |

Free tier limits: 500 builds/month and 20,000 files per deployment. You will not come close.

---

# Troubleshooting

| Problem | Cause and fix |
|---|---|
| Build fails: `Cannot find module` | `package.json` was not committed, or `node_modules` was. Check the repo on GitHub — you should see `package.json` and `package-lock.json`, and no `node_modules`. |
| Build fails on Cloudflare, works locally | The `NODE_VERSION = 22` environment variable is missing. Add it under Settings → Environment variables, then **Retry deployment**. |
| Build succeeds, page is blank white | Build output directory is wrong. It must be exactly `dist`. |
| Custom domain stuck on "Pending" past 15 min | Nameservers have not fully switched. Run `dig NS yourdomain.com` (or use [whatsmydns.net](https://www.whatsmydns.net)) and confirm both answers are `*.ns.cloudflare.com`. |
| "This domain is not in your account" | The domain is not yet an active zone on the same Cloudflare account. Finish step B2 and wait for the Active email. |
| `ERR_TOO_MANY_REDIRECTS` | SSL/TLS mode is Flexible. Set it to **Full (strict)**. |
| Site works, `www` does not | You only added the apex. Add `www.yourdomain.com` as a second custom domain in step B3. |
| Old version keeps showing | Hard refresh (`Ctrl/Cmd + Shift + R`). If it persists, Purge Everything. |
| WhatsApp button opens the wrong number | `brand.whatsapp` in `src/data/site.js` — digits only, with country code, no `+` and no spaces. |
| Photos missing on the live site | They must be inside `public/media/…` and committed to Git. Confirm they appear in the GitHub repo. |
| Fonts fall back to a plain sans | Google Fonts is blocked or slow on that network. The site stays fully readable; nothing is broken. |

---

# Quick reference

```
Build command ............ npm run build
Output directory ......... dist
Node version ............. 22       (set NODE_VERSION as an env var)
Production branch ........ main
SPA routing .............. handled by public/_redirects
Cache + security headers . handled by public/_headers
SSL/TLS mode ............. Full (strict)
Update the site .......... git push        (Method A)
                           npm run deploy  (Method B)
```
