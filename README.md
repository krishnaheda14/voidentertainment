# VOID ENTERTAINMENT

Website for Void Entertainment — nightlife access, guestlists and table bookings across Mumbai.

Built with React + Vite + Tailwind + Framer Motion. Static output, no server, no database. Deploys to Cloudflare Pages in about three minutes.

---

## 0. The two-minute version

```bash
npm install        # once
npm run dev        # start the site at http://localhost:5173
npm run build      # produce the dist/ folder for deploying
npm run preview    # check the built site at http://localhost:4173
```

Then read **DEPLOY-CLOUDFLARE.md** for hosting.

---

## 1. Before you launch — the one thing you must change

Open **`src/data/content.json`** and put your real WhatsApp number in:

```js
whatsapp: '919999999999',        // country code + number, digits only, no + and no spaces
whatsappLabel: '+91 99999 99999' // how it appears on screen
```

For **+91 98765 43210** you would write `'919876543210'`.

Every button on the site — the nav, the hero, the schedule rows, the venue cards, the floating button, the booking form — builds its link from this one value. Get it wrong and every button on the site goes to the wrong number, so test it once after your first deploy by tapping the floating **Book now** button on your phone.

While you are in that file, also set `email`, `instagram`, `instagramHandle` and `domain`.

---

## 2. Running it on your machine

**You need Node.js 18.18 or newer.** Check with `node -v`. If you do not have it, install the LTS build from [nodejs.org](https://nodejs.org). Node 22 is what this project was built and tested on.

```bash
cd void-entertainment
npm install
npm run dev
```

Open **http://localhost:5173**. Edits save instantly — no refresh needed.

To view it on your phone while developing, the dev server also prints a `Network:` address like `http://192.168.1.7:5173`. Open that on your phone while it is on the same Wi-Fi.

To stop the server: `Ctrl + C`.

---

## 3. Changing the content

Everything you will realistically want to change lives in **`src/data/site.js`**. You do not need to touch any other file.

### The weekly schedule

Change `weekLabel` at the top, then edit the `week` array. Each night looks like this:

```js
{
  day: 'Fri',            // MUST be one of: Mon Tue Wed Thu Fri Sat Sun
  long: 'Friday',
  events: [
    {
      venue: 'mercii',              // must match a `slug` in the venues array
      title: 'MERCII Fridays',
      sub: 'Dinner till 23:00, floor after',
      artist: 'Resident — Anaya B',
      door: '20:00',                // 24-hour clock, this drives the live countdown
      couple: '₹0 before 22:00',
      stag: '₹2,000',
      table: 'From ₹35,000',
      status: 'filling',            // 'open' | 'filling' | 'closed'
    },
  ],
},
```

Add as many events per night as you like — they stack. A night with an empty `events: []` shows a "message the desk" line instead.

**`status`** controls the dot next to the event: green = Open, orange blinking = Filling fast, grey = Closed (the row is also dimmed).

### The live "tonight" rail

The strip under the hero reads the real Mumbai clock, works out what night it is, and counts down to the first door of the evening. You do not configure this — it just follows whatever is in `week`.

One deliberate detail: **anything before 06:00 IST still counts as the night before.** At 1am on Saturday the site still shows you Friday's programme, because that is the night people are actually out on.

### Venues

The `venues` array. Addresses, coordinates and Google Maps links are already filled in correctly for all four rooms. Change `blurb`, `sound`, `dress`, `tags`, `capacity` and `best` freely.

The `slug` is the ID that `week` events point at — if you rename a slug, update every event that references it.

### Photos and videos

Nothing is required to launch. Any image that is missing renders as a generated gradient tile labelled **Photo pending**, so the site never looks broken.

When you have real assets, drop them in with these exact filenames:

```
public/media/venues/mercii.jpg
public/media/venues/baglami.jpg
public/media/venues/onrique.jpg
public/media/venues/bastian.jpg

public/media/gallery/nye-bastian.jpg
public/media/gallery/onrique-012.jpg
public/media/gallery/baglami-bolly.jpg
public/media/gallery/mercii-low.jpg
public/media/gallery/holi-bastian.jpg
```

Aim for roughly 1600px wide, JPG, under 400 KB each. Anything much bigger will slow the site down on 4G, which is how most of your traffic will arrive.

**Aftermovies.** In the `pastNights` array, each item takes either:

```js
youtube: 'dQw4w9WgXcQ',              // just the ID from the YouTube URL — recommended
// or
video: '/media/videos/nye-2026.mp4', // self-hosted, keep under ~15 MB
```

YouTube is strongly preferred. It handles the bandwidth, the transcoding and the mobile playback for free, and it will not eat your Cloudflare limits.

### Everything else

`stats`, `howItWorks` and `faqs` are plain arrays — add or remove entries and the layout adapts.

---

## 4. What is in the box

```
void-entertainment/
├── index.html                 Meta tags, fonts, structured data, anti-flash boot screen
├── src/
│   ├── data/site.js           ← ALL your content lives here
│   ├── lib/utils.js           WhatsApp links, IST clock, smooth scroll
│   ├── index.css              Design tokens + the brushed-metal type treatment
│   ├── App.jsx                Page composition
│   └── components/
│       ├── Chrome.jsx         Preloader, cursor, nav, floating WhatsApp button
│       ├── Hero.jsx           Hero + the live Tonight rail
│       ├── Schedule.jsx       Seven-night board
│       ├── Venues.jsx         Horizontal venue walk (desktop) / stack (mobile)
│       ├── Strip.jsx          Ticker, numbers, three-step process
│       ├── PastNights.jsx     Video + photo wall with lightbox
│       ├── Book.jsx           FAQ, booking composer, footer
│       └── ui.jsx             Shared bits (buttons, reveals, image fallback)
├── public/
│   ├── _headers               Cloudflare cache + security headers
│   ├── _redirects             SPA routing so deep links never 404
│   ├── robots.txt, sitemap.xml, favicon.svg
│   └── media/                 Your photos and videos
├── wrangler.toml              Only needed for CLI deploys
└── DEPLOY-CLOUDFLARE.md       Hosting, start to finish
```

---

## 5. Design notes

**Palette.** Near-black `#050506` ground, brushed silver for type, `#FF5A00` orange as the single accent. The silver is a real multi-stop gradient with a specular band running through the letterforms, not flat grey — that is the `.metal` class in `index.css`.

**Type.** Anton for display (condensed, heavy, reads like a gig poster), Space Grotesk for body, JetBrains Mono for anything that is data — door times, prices, coordinates, capacities. The mono face is doing real work: this business trades in numbers at the door, so numbers get their own voice.

**The door.** The preloader is two black panels held shut with a sliver of orange light between them that widens, then pulls apart. The two silver uprights either side of the hero are the same door frame, left standing. It is the whole business in one gesture.

**Motion.** Everything ambient — grain, embers, marquees, the pointer light-leak — stops dead when the operating system asks for reduced motion, and nothing disappears when it does. Keyboard focus rings are visible throughout.

**Why there is no contact form backend.** The booking panel composes the WhatsApp message and hands it to WhatsApp; the customer presses send from their own phone. That means no server, no database, no form service to pay for, no submissions silently failing into a spam folder — and you get the customer's number in a thread you can reply to. It is the right architecture for this business, not a shortcut.

---

## 6. Common problems

| What you see | What to do |
|---|---|
| `npm: command not found` | Install Node.js from nodejs.org, then reopen your terminal |
| Build fails right after cloning | Delete `node_modules` and `package-lock.json`, run `npm install` again |
| WhatsApp button opens the wrong chat | `brand.whatsapp` in `src/data/site.js` — digits only, country code, no `+` |
| An event does not show up | Its `venue` value must exactly match a venue `slug`, and `day` must be one of the seven three-letter codes |
| Photos not appearing | Filename and folder must match exactly, and files go in `public/media/…`, not `src/` |
| Countdown looks wrong | It runs on Mumbai time on purpose, whatever your laptop clock says |
| Fonts look plain | The Google Fonts request is being blocked — check your connection or ad blocker |

---

## 7. Updating the live site

If you deployed via GitHub (the recommended route in the deploy guide), your weekly workflow is:

```bash
# edit src/data/site.js with the new week
git add .
git commit -m "Week of 7 September"
git push
```

Cloudflare rebuilds and publishes automatically in about a minute. Nothing else to do.
