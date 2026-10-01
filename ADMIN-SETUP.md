# Setting up the admin panel — plain steps

Your site has a private page at **yoursite.com/admin**. From there you can:

- Change the weekly schedule, the brand info (WhatsApp number etc.), and the
  "What it looks like" photo/video gallery.
- Upload venue photos and gallery photos/videos.
- See a running count of how many times the site has been opened.

To make all of that actually go live on the real website, you need to do
**two short setup jobs, once.** This page walks through both, in order.
Total time: about 10 minutes.

---

## What you need before you start

- A **GitHub account** with this project's code already on it (you have
  this already, since that's how you deploy).
- A **Cloudflare account**, with this site already set up as a Cloudflare
  Pages project (this is what makes your site live on the internet).

If you deploy on Vercel instead of Cloudflare, skip to **Part 3** — you
only need the GitHub token, not the Cloudflare KV part.

---

## Part 1 — Get a GitHub token

This token lets the admin panel save your photo/video uploads back into
your GitHub project automatically, so they show up on the live site.

1. Go to **github.com** and log in.
2. Click your profile picture in the top-right corner → **Settings**.
3. Scroll all the way down the left-hand menu → click **Developer settings**
   (it's near the bottom, below "Code security").
4. Click **Personal access tokens** → **Fine-grained tokens**.
5. Click the green **Generate new token** button.
6. Fill in the form:
   - **Token name**: anything you like, e.g. `void-admin`.
   - **Expiration**: pick something like 1 year (you can make a new one
     later if it expires).
   - **Repository access**: choose **Only select repositories**, then pick
     your `voidentertainment` repository from the list.
   - Scroll down to **Permissions** → **Repository permissions** → find
     **Contents** → change it from "No access" to **Read and write**.
     Leave everything else as is.
7. Scroll down and click **Generate token**.
8. **Copy the token now.** It's a long string starting with `github_pat_`.
   GitHub only shows it to you this one time — if you lose it, you'll just
   generate a new one.

Keep this somewhere safe for a minute — you'll paste it into Cloudflare
next.

---

## Part 2 — Turn on live updates and the photo counter (Cloudflare KV)

"KV" is just Cloudflare's name for a simple storage box. You need **one**
of these. It's used for two things: holding your live schedule/gallery
content, and counting page views.

### 2.1 — Create the storage box

1. Go to **dash.cloudflare.com** and log in.
2. In the left sidebar, find **Storage & Databases** → click **KV**.
3. Click **Create a namespace**.
4. Name it `void-content` (or anything you'll recognize) → **Add**.

### 2.2 — Connect it to your website

1. Go to **Workers & Pages** in the left sidebar → click on your Pages
   project (the one running this site).
2. Click **Settings** → **Functions**.
3. Scroll to **KV namespace bindings** → click **Add binding**.
4. Fill in:
   - **Variable name**: `CONTENT_KV` (type it exactly like this — capital
     letters, underscore)
   - **KV namespace**: pick the `void-content` one you just made.
5. Click **Save**.

### 2.3 — Add your GitHub token here too

Still in **Settings** → on the left, click **Environment variables**.

1. Click **Add variable** and add:
   - Name: `GITHUB_TOKEN` — Value: the token you copied in Part 1.
   - Click **Encrypt** on this one, since it's a secret.
2. Click **Add variable** again and add:
   - Name: `GITHUB_REPO` — Value: `yourusername/voidentertainment` (replace
     with your actual GitHub username/repo — check the URL of your repo on
     github.com if unsure).
3. Save.

### 2.4 — Redeploy once

Go to the **Deployments** tab of your Pages project → click the **⋯** menu
on the latest deployment → **Retry deployment** (or just push any small
change to GitHub — either triggers a fresh deploy that picks up what you
just set).

That's it for setup. From now on:

- **Schedule and gallery changes** you publish from `/admin` show up on
  the live site within a few seconds (no waiting for a rebuild) — they're
  being saved straight into the KV storage box.
- **The view counter** at the bottom of the site starts counting
  automatically, using that same storage box.
- **Photos and videos** you upload from `/admin` get saved into your
  GitHub project (using the token from Part 1), which triggers a normal
  rebuild — they appear on the live site in about a minute.

---

## Part 3 — If you're on Vercel instead of Cloudflare

Everything in Part 2 is Cloudflare-specific (KV doesn't exist on Vercel).
On Vercel, schedule/gallery publishing works a different way: it saves
straight into your GitHub project too (same as photos), and a normal
rebuild puts it live in about a minute. The view counter won't work on
Vercel — that part only runs on Cloudflare.

1. Go to your project on **vercel.com** → **Settings** → **Environment
   Variables**.
2. Add `GITHUB_TOKEN` (the token from Part 1) and `GITHUB_REPO`
   (`yourusername/voidentertainment`).
3. Redeploy once.

---

## Part 4 — Using the admin panel day to day

1. Go to **yoursite.com/admin**.
2. Log in with the ID and password (see "Changing your login" below if you
   don't have one set yet).
3. On the left: the schedule, brand info and gallery, as real forms — not
   JSON to hand-edit.
   - **Schedule** — all seven days are always shown. Each day is a card;
     click **"+ Add a room to [day]"** to add another venue running that
     night, or the **×** on a room to remove it. A day can hold as many
     rooms as are actually on.
   - **Brand** — WhatsApp number, email, Instagram, hours, etc.
   - **Gallery ("What it looks like")** — click **"+ Add a night to the
     gallery"** for a new blank card (title, venue, caption, a photo or
     video), or **×** to remove one.
   - **Publish live** — pushes everything to the real site.
   - **Preview only** — shows it to you in this browser first, so you can
     check it looks right before publishing.
4. On the right: upload a photo or video.
   - Pick what it's for (a specific venue, or a gallery photo/video).
   - Choose the file from your computer → **Upload**.
   - For a venue photo, you're done — it appears automatically.
   - For a gallery photo or video, click **"Add to gallery below"** after
     it uploads — that drops a new, pre-filled card straight into the
     gallery list on the left. Just give it a title and venue, then
     publish.
   - **For a video longer than a few seconds**, upload it to YouTube
     instead (as "Unlisted" if you don't want it public) and paste the
     **link** into that gallery card's YouTube field — either the full
     URL or just the ID works. This plays far more reliably than a
     self-hosted file.

### Changing your login

1. Open a terminal on your computer, in the project folder.
2. Run this, replacing `YOUR_ID` and `YOUR_PASSWORD`:
   ```bash
   node -e "const c=require('crypto');console.log(c.createHash('sha256').update('YOUR_ID:YOUR_PASSWORD').digest('hex'))"
   ```
3. It prints a long string of letters and numbers. Copy it.
4. Open `src/lib/adminHash.js`, replace the value there with what you
   copied, save, commit, and push.

---

## Part 5 — Make photo/video uploads go live automatically (Cloudflare only)

If you deployed to Cloudflare with `npm run deploy` (the command-line way,
not Cloudflare's own "Connect to Git" dashboard flow), there's one gap
worth knowing about: Cloudflare has no idea your GitHub repo exists, so
when `/admin`'s photo/video uploader commits a new file to GitHub, nothing
happens on the live site until **you** run `npm run deploy` again by hand.

Schedule/brand/gallery text changes don't have this problem — those publish
straight into the KV store from Part 2 and show up instantly regardless.
This only affects actual photo/video files.

**The fix:** a GitHub Action, already added to this repo at
`.github/workflows/deploy-cloudflare.yml`, that runs the deploy command for
you automatically on every push. It needs two values from you, added once
as GitHub repo secrets:

1. **Create a Cloudflare API token.**
   - dash.cloudflare.com → click your profile icon (top right) → **My
     Profile** → **API Tokens** → **Create Token**.
   - Find the **"Edit Cloudflare Workers"** template → **Use template**
     (Pages deploys go through the same permission as Workers).
   - Leave the account/zone scoping as-is (or narrow it to just your
     account) → **Continue to summary** → **Create Token**.
   - Copy it — shown once, same as the GitHub token.

2. **Find your Cloudflare Account ID.**
   - dash.cloudflare.com → **Workers & Pages** → it's listed in the right
     sidebar on that page as **Account ID**. Copy it.

3. **Add both as GitHub repo secrets.**
   - github.com → your repo → **Settings** → **Secrets and variables** →
     **Actions** → **New repository secret**.
   - Add `CLOUDFLARE_API_TOKEN` (the token from step 1).
   - Add `CLOUDFLARE_ACCOUNT_ID` (the ID from step 2).

That's it — no redeploy needed to turn this on, it takes effect on the next
push. From then on, every push to `main` (including the automatic commits
from photo/video uploads) builds and deploys to Cloudflare on its own.

The Cloudflare dashboard's "disconnected from your Git account" warning
will still show — that message is specifically about Cloudflare's own
native Git integration, which this isn't using. It's safe to ignore once
this Action is set up; the Action achieves the same practical result
(auto-deploy on push) without needing to recreate the project.

---

## Troubleshooting

| What you see | What it means |
|---|---|
| "Server is not configured to publish yet" | Part 1/2 (or Part 3 on Vercel) isn't finished — double check the token and variable names are typed exactly right. |
| Publish works but the site doesn't change | On Cloudflare, check the `CONTENT_KV` binding name is exactly that. On either host, hard-refresh the page (Ctrl/Cmd + Shift + R). |
| Photo upload fails with "too large" | Keep photos under 8MB and videos under 20MB. For longer videos, use YouTube instead (see Part 4). |
| View counter doesn't show up | That only works on Cloudflare with Part 2 done — it stays hidden everywhere else, which is normal. |
| Wrong ID or password | Check `src/lib/adminHash.js` — see "Changing your login" above. |
| Photo uploaded but not live on Cloudflare | Part 5 isn't set up yet, or the GitHub Action failed — check the **Actions** tab on your GitHub repo for a red ✕. Until then, run `npm run deploy` by hand. |
| Cloudflare says "disconnected from your Git account" | Expected for a direct-upload project — see Part 5. Safe to ignore once the Action there is set up. |

---

## Quick reference

```
Admin page ................ yoursite.com/admin
GitHub token ............... github.com → your profile → Settings →
                              Developer settings → Personal access tokens →
                              Fine-grained tokens
Cloudflare KV storage ...... dash.cloudflare.com → Storage & Databases → KV
Connect KV to your site .... Workers & Pages → your project → Settings →
                              Functions → KV namespace bindings
Env vars (either host) ..... GITHUB_TOKEN, GITHUB_REPO
Auto-deploy on Cloudflare .. GitHub repo secrets CLOUDFLARE_API_TOKEN,
                              CLOUDFLARE_ACCOUNT_ID — see Part 5
Change login ............... src/lib/adminHash.js
```
