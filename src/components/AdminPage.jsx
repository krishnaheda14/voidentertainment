import { useEffect, useRef, useState } from 'react'
import { Lock, Check, Trash2, Plus, X, UploadCloud, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import {
  week as defaultWeek,
  weekLabel as defaultWeekLabel,
  brand as defaultBrand,
  pastNights as defaultPastNights,
  venues,
} from '../data/site'
import {
  checkLogin,
  loadOverrides,
  saveOverrides,
  clearOverrides,
  notifyDataChanged,
  validateWeek,
  validatePastNights,
} from '../lib/admin'
import { VoidButton } from './ui'
import { cx } from '../lib/utils'
import logo from '../data/logo-mark.png'

const DAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_LONG = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}
const STATUS_OPTIONS = ['open', 'filling', 'closed']
const SPAN_OPTIONS = ['normal', 'wide', 'tall']

const BRAND_FIELDS = [
  ['name', 'Short name'],
  ['full', 'Full name'],
  ['city', 'City'],
  ['tagline', 'Tagline'],
  ['whatsapp', 'WhatsApp number — digits only, country code, no +'],
  ['whatsappLabel', 'WhatsApp label — shown on screen'],
  ['email', 'Email'],
  ['instagram', 'Instagram URL'],
  ['instagramHandle', 'Instagram handle'],
  ['domain', 'Domain'],
  ['hours', 'Hours text'],
]

const fieldClass =
  'w-full border border-silver/15 bg-void-100 px-2.5 py-2 font-mono text-[11px] text-silver-hi outline-none transition-colors focus:border-flare'

/** Always shows all 7 days, in order — synthesizes an empty one for any
    day code missing from the saved week, so there's always somewhere to
    add a room without having to know the data was incomplete. */
function normalizeWeek(week) {
  return DAY_CODES.map((code) => {
    const existing = (week || []).find((d) => d.day === code)
    return existing ? { ...existing, events: existing.events || [] } : { day: code, long: DAY_LONG[code], events: [] }
  })
}

function emptyEvent() {
  return {
    venue: venues[0]?.slug || '',
    title: '',
    sub: '',
    artist: '',
    door: '20:00',
    couple: '',
    stag: '',
    table: '',
    status: 'filling',
  }
}

function emptyNight(extra = {}) {
  return { title: '', venue: '', meta: '', poster: '', youtube: '', video: '', span: 'normal', ...extra }
}

function currentOverridesData() {
  const o = loadOverrides()
  return {
    weekLabel: (o && o.weekLabel) || defaultWeekLabel,
    week: (o && o.week) || defaultWeek,
    brand: { ...defaultBrand, ...(o && o.brand ? o.brand : {}) },
    pastNights: (o && o.pastNights) || defaultPastNights,
  }
}

/* ==========================================================================
   ADMIN PAGE — a dedicated, bookmarkable /admin route (not a modal), so it
   has its own URL to hand to whoever manages the content day to day. Same
   login + publish mechanism as before: see src/lib/admin.js and
   api/save-content.js / functions/api/save-content.js for how a save
   actually reaches the live site.
   ========================================================================== */
export default function AdminPage() {
  // Both reset on every page load by design — credentials are kept in
  // memory only (never in sessionStorage/localStorage) so the API routes
  // can re-verify each publish/upload server-side. That means a reload
  // always requires logging in again; there is no "stay logged in" state
  // that could end up without the credentials to back it up.
  const [loggedIn, setLoggedIn] = useState(false)
  const [creds, setCreds] = useState(null)

  // index.html paints a static "VOID" boot screen to avoid a white flash;
  // on the main site, Preloader removes it once React is ready. This route
  // skips Preloader entirely, so it has to clear the boot screen itself.
  useEffect(() => {
    document.getElementById('boot')?.remove()
  }, [])

  return (
    <div className="min-h-screen bg-void-000">
      <header className="border-b border-silver/10">
        <div className="shell flex h-16 items-center justify-between sm:h-[72px]">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Void Entertainment" className="h-9 w-auto" />
            <span className="hidden font-mono text-[9px] uppercase tracking-widest2 text-silver-lo sm:block">
              Admin
            </span>
          </a>
          <a
            href="/"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo transition-colors hover:text-flare"
          >
            <ArrowLeft size={13} /> Back to site
          </a>
        </div>
      </header>

      <main className="shell py-10 sm:py-14">
        <div className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest2 text-silver-mid">
          <Lock size={13} className="text-flare" /> Admin
        </div>

        {loggedIn ? (
          <EditPage
            creds={creds}
            onLogout={() => {
              setCreds(null)
              setLoggedIn(false)
            }}
          />
        ) : (
          <LoginForm
            onSuccess={(c) => {
              setCreds(c)
              setLoggedIn(true)
            }}
          />
        )}
      </main>
    </div>
  )
}

function LoginForm({ onSuccess }) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const trimmedId = id.trim()
    const ok = await checkLogin(trimmedId, password)
    setBusy(false)
    if (ok) {
      onSuccess({ id: trimmedId, password })
    } else {
      setError('Wrong ID or password.')
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4 border border-silver/15 bg-void-100 p-6 sm:p-8">
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
          ID
        </label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoFocus
          autoComplete="username"
          className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 text-sm text-silver-hi outline-none transition-colors focus:border-flare"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 text-sm text-silver-hi outline-none transition-colors focus:border-flare"
        />
      </div>
      {error && <p className="text-xs text-flare">{error}</p>}
      <VoidButton type="submit" size="md" className="w-full" disabled={busy}>
        {busy ? 'Checking…' : 'Log in'}
      </VoidButton>
    </form>
  )
}

function EditPage({ creds, onLogout }) {
  const [data, setData] = useState(currentOverridesData)

  const addGalleryItem = (fields) => {
    setData((d) => ({ ...d, pastNights: [...d.pastNights, emptyNight(fields)] }))
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr]">
      <ContentEditor data={data} setData={setData} creds={creds} />
      <ImageUploader creds={creds} onAddGalleryItem={addGalleryItem} />
      <button
        onClick={onLogout}
        className="font-mono text-[10px] uppercase tracking-widest2 text-silver-lo transition-colors hover:text-flare lg:col-span-2"
      >
        Log out
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-silver-lo">{label}</span>
      {children}
    </label>
  )
}

/* ==========================================================================
   SCHEDULE — one card per day of the week, always all seven, each holding
   however many rooms are running that night. Add/remove rooms freely, so
   a day with two or three venues running at once is just two or three
   cards in that day's list.
   ========================================================================== */
function EventFields({ ev, onChange, onRemove }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value })
  return (
    <div className="relative border border-silver/10 bg-void-000 p-3">
      <button
        onClick={onRemove}
        aria-label="Remove this room"
        className="absolute right-2 top-2 text-silver-lo transition-colors hover:text-flare"
      >
        <X size={13} />
      </button>
      <div className="grid gap-2 pr-6 sm:grid-cols-2">
        <Field label="Venue">
          <select value={ev.venue} onChange={set('venue')} className={fieldClass}>
            {venues.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={ev.status} onChange={set('status')} className={fieldClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input value={ev.title} onChange={set('title')} className={fieldClass} />
        </Field>
        <Field label="Subtitle">
          <input value={ev.sub} onChange={set('sub')} className={fieldClass} />
        </Field>
        <Field label="Artist / DJ">
          <input value={ev.artist} onChange={set('artist')} className={fieldClass} />
        </Field>
        <Field label="Door time">
          <input value={ev.door} onChange={set('door')} placeholder="20:00" className={fieldClass} />
        </Field>
        <Field label="Couple entry">
          <input value={ev.couple} onChange={set('couple')} className={fieldClass} />
        </Field>
        <Field label="Stag entry">
          <input value={ev.stag} onChange={set('stag')} className={fieldClass} />
        </Field>
        <Field label="Table">
          <input value={ev.table} onChange={set('table')} className={fieldClass} />
        </Field>
      </div>
    </div>
  )
}

function DayCard({ day, onAddEvent, onRemoveEvent, onUpdateEvent }) {
  return (
    <div className="border border-silver/15 bg-void-100 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-mono text-[11px] uppercase tracking-widest2 text-silver-hi">{day.long}</h4>
        <span className="font-mono text-[10px] text-silver-lo">
          {day.events.length} room{day.events.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="space-y-3">
        {day.events.map((ev, i) => (
          <EventFields
            key={i}
            ev={ev}
            onChange={(patch) => onUpdateEvent(i, patch)}
            onRemove={() => onRemoveEvent(i)}
          />
        ))}
        {day.events.length === 0 && (
          <p className="font-mono text-[10px] text-silver-lo">Nothing running — the site shows "message the desk" for this night.</p>
        )}
      </div>
      <button
        onClick={onAddEvent}
        className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest2 text-flare transition-colors hover:text-flare-hot"
      >
        <Plus size={12} /> Add a room to {day.long}
      </button>
    </div>
  )
}

function ScheduleEditor({ data, setData }) {
  const days = normalizeWeek(data.week)

  const updateDay = (code, updater) => {
    setData((d) => ({ ...d, week: normalizeWeek(d.week).map((day) => (day.day === code ? updater(day) : day)) }))
  }

  return (
    <div>
      <Field label="Week label — shown above the schedule">
        <input
          value={data.weekLabel}
          onChange={(e) => setData((d) => ({ ...d, weekLabel: e.target.value }))}
          className={fieldClass}
        />
      </Field>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {days.map((day) => (
          <DayCard
            key={day.day}
            day={day}
            onAddEvent={() => updateDay(day.day, (d) => ({ ...d, events: [...d.events, emptyEvent()] }))}
            onRemoveEvent={(i) =>
              updateDay(day.day, (d) => ({ ...d, events: d.events.filter((_, idx) => idx !== i) }))
            }
            onUpdateEvent={(i, patch) =>
              updateDay(day.day, (d) => ({
                ...d,
                events: d.events.map((ev, idx) => (idx === i ? { ...ev, ...patch } : ev)),
              }))
            }
          />
        ))}
      </div>
    </div>
  )
}

/* ==========================================================================
   BRAND
   ========================================================================== */
function BrandEditor({ data, setData }) {
  const set = (k) => (e) => setData((d) => ({ ...d, brand: { ...d.brand, [k]: e.target.value } }))
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BRAND_FIELDS.map(([key, label]) => (
        <Field key={key} label={label}>
          <input value={data.brand[key] || ''} onChange={set(key)} className={fieldClass} />
        </Field>
      ))}
    </div>
  )
}

/* ==========================================================================
   GALLERY — "What it looks like" on the site. Add as many nights as you
   want; each one is a free-standing card, not tied to any fixed list.
   ========================================================================== */
function slugify(s) {
  return (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function NightFields({ n, onChange, onRemove, creds }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be re-picked later if needed
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const ext = file.name.match(/\.(jpe?g|png|webp)$/i)?.[0]?.toLowerCase() || '.jpg'
      const path = `media/gallery/${slugify(n.title) || `night-${Date.now()}`}${ext}`
      const contentBase64 = await fileToBase64(file)
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, path, contentBase64 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
      onChange({ poster: data.path })
    } catch (err) {
      setUploadError(err.message || 'Failed to upload.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative border border-silver/10 bg-void-000 p-3">
      <button
        onClick={onRemove}
        aria-label="Remove this night"
        className="absolute right-2 top-2 text-silver-lo transition-colors hover:text-flare"
      >
        <X size={13} />
      </button>
      <div className="grid gap-2 pr-6 sm:grid-cols-2">
        <Field label="Title">
          <input value={n.title} onChange={set('title')} placeholder="e.g. Diwali Bash 2026" className={fieldClass} />
        </Field>
        <Field label="Venue">
          <input value={n.venue} onChange={set('venue')} placeholder="e.g. MERCII" className={fieldClass} />
        </Field>
        <Field label="Caption">
          <input value={n.meta} onChange={set('meta')} placeholder="e.g. 400 guests · sold out" className={fieldClass} />
        </Field>
        <Field label="Card size">
          <select value={n.span} onChange={set('span')} className={fieldClass}>
            {SPAN_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Poster photo">
          <div className="flex gap-1.5">
            <input
              value={n.poster}
              onChange={set('poster')}
              placeholder="/media/gallery/name.jpg"
              className={cx(fieldClass, 'flex-1')}
            />
            <label
              className={cx(
                'flex shrink-0 cursor-pointer items-center gap-1 border border-silver/15 bg-flare px-2.5 py-2 font-mono text-[10px] uppercase tracking-widest2 text-void-000 transition-colors hover:bg-flare-hot',
                uploading && 'pointer-events-none opacity-60'
              )}
            >
              <UploadCloud size={12} /> {uploading ? '…' : 'Upload'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePosterUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {uploadError && <p className="mt-1 text-[10px] text-flare">{uploadError}</p>}
        </Field>
        <Field label="YouTube link — paste the full URL or just the ID">
          <input
            value={n.youtube}
            onChange={set('youtube')}
            placeholder="https://youtu.be/dQw4w9WgXcQ — unlisted is fine"
            className={fieldClass}
          />
        </Field>
        <Field label="Self-hosted video path (short clips only)">
          <input value={n.video} onChange={set('video')} placeholder="/media/videos/name.mp4" className={fieldClass} />
        </Field>
      </div>
    </div>
  )
}

function GalleryEditor({ data, setData, creds }) {
  const addNight = () => setData((d) => ({ ...d, pastNights: [...d.pastNights, emptyNight()] }))
  const removeNight = (i) => setData((d) => ({ ...d, pastNights: d.pastNights.filter((_, idx) => idx !== i) }))
  const updateNight = (i, patch) =>
    setData((d) => ({ ...d, pastNights: d.pastNights.map((n, idx) => (idx === i ? { ...n, ...patch } : n)) }))

  return (
    <div className="space-y-3">
      {data.pastNights.map((n, i) => (
        <NightFields
          key={i}
          n={n}
          creds={creds}
          onChange={(patch) => updateNight(i, patch)}
          onRemove={() => removeNight(i)}
        />
      ))}
      {data.pastNights.length === 0 && (
        <p className="font-mono text-[10px] text-silver-lo">No nights in the gallery yet.</p>
      )}
      <button
        onClick={addNight}
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest2 text-flare transition-colors hover:text-flare-hot"
      >
        <Plus size={12} /> Add a night to the gallery
      </button>
    </div>
  )
}

/* ==========================================================================
   CONTENT EDITOR — schedule, brand and gallery together, published as one
   unit so "Publish live" always sends a complete, consistent copy.
   ========================================================================== */
function ContentEditor({ data, setData, creds }) {
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null) // 'previewed' | 'publishing' | 'published' | 'publish-error'
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = (next) => {
    setStatus(next)
    clearTimeout(timer.current)
    if (next === 'previewed' || next === 'published') {
      timer.current = setTimeout(() => setStatus(null), 3000)
    }
  }

  const buildPayload = () => ({
    weekLabel: data.weekLabel,
    week: normalizeWeek(data.week),
    brand: data.brand,
    pastNights: data.pastNights,
  })

  const validate = (payload) => {
    setError('')
    try {
      validateWeek(payload.week)
      validatePastNights(payload.pastNights)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const preview = () => {
    const payload = buildPayload()
    if (!validate(payload)) return
    saveOverrides(payload)
    notifyDataChanged()
    flash('previewed')
  }

  const publish = async () => {
    const payload = buildPayload()
    if (!validate(payload)) return

    saveOverrides(payload)
    notifyDataChanged()
    flash('publishing')

    try {
      const res = await fetch('/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, ...payload }),
      })
      const resData = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(resData.error || `Publish failed (${res.status})`)
      flash('published')
    } catch (err) {
      setError(err.message || 'Failed to publish.')
      flash('publish-error')
    }
  }

  const reset = () => {
    clearOverrides()
    notifyDataChanged()
    setData(currentOverridesData())
    setError('')
    flash('previewed')
  }

  return (
    <section className="border border-silver/15 bg-void-100 p-6 sm:p-8">
      <h2 className="metal mb-1 font-display text-2xl">Schedule, brand &amp; gallery</h2>
      <p className="mb-6 text-xs leading-relaxed text-silver-mid">
        All seven days are here, even the quiet ones — add as many rooms as are actually running on a given
        night. <strong className="text-silver-hi">Publish live</strong> pushes everything below to the real
        site for every visitor. <strong className="text-silver-hi">Preview only</strong> just previews it in
        this browser.
      </p>

      <div className="mb-8">
        <h3 className="eyebrow mb-3">This week</h3>
        <ScheduleEditor data={data} setData={setData} />
      </div>

      <div className="mb-8">
        <h3 className="eyebrow mb-3">Brand</h3>
        <BrandEditor data={data} setData={setData} />
      </div>

      <div className="mb-6">
        <h3 className="eyebrow mb-3">What it looks like (gallery)</h3>
        <GalleryEditor data={data} setData={setData} creds={creds} />
      </div>

      {error && <p className="mb-2 text-xs text-flare">{error}</p>}
      {!error && status === 'previewed' && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check size={13} /> Previewed in this browser only.
        </p>
      )}
      {!error && status === 'publishing' && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-silver-mid">
          <UploadCloud size={13} className="animate-pulse" /> Publishing…
        </p>
      )}
      {!error && status === 'published' && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check size={13} /> Published — live on Cloudflare in seconds, or within ~1–2 minutes if this
          site publishes via GitHub.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <VoidButton size="sm" onClick={publish} disabled={status === 'publishing'}>
          <UploadCloud size={13} /> {status === 'publishing' ? 'Publishing…' : 'Publish live'}
        </VoidButton>
        <VoidButton size="sm" variant="ghost" onClick={preview}>
          <Check size={13} /> Preview only
        </VoidButton>
        <VoidButton size="sm" variant="ghost" onClick={reset}>
          <Trash2 size={13} /> Reset to defaults
        </VoidButton>
      </div>
    </section>
  )
}

/* ==========================================================================
   IMAGE / VIDEO UPLOADER
   Picks a photo or a short video, commits it straight to the exact
   /public/media path the site already expects (same GitHub publish
   pipeline as the content editor above) — so for a venue photo, nothing
   else needs to change for it to appear. For a gallery photo or video,
   a successful upload offers a one-click "Add to gallery below" that
   drops a new, pre-filled card straight into the gallery editor — just
   give it a title and venue, then publish.
   ========================================================================== */
const TARGETS = [
  ...venues.map((v) => ({
    value: `venue:${v.slug}`,
    label: `${v.name} — venue photo`,
    path: `media/venues/${v.slug}`,
    kind: 'image',
  })),
  { value: 'gallery-photo', label: 'Past nights — gallery poster (photo)', path: 'media/gallery/', kind: 'image' },
  { value: 'gallery-video', label: 'Past nights — gallery clip (video)', path: 'media/videos/', kind: 'video' },
  { value: 'custom', label: 'Custom path (advanced)', path: '', kind: 'any' },
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ImageUploader({ creds, onAddGalleryItem }) {
  const [target, setTarget] = useState(TARGETS[0].value)
  const [filename, setFilename] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [added, setAdded] = useState(false)

  const selected = TARGETS.find((t) => t.value === target)
  const needsFilename = target === 'gallery-photo' || target === 'gallery-video'
  const isGallery = needsFilename
  const defaultExt = selected.kind === 'video' ? '.mp4' : '.jpg'
  const ext =
    file?.name.match(/\.(jpe?g|png|webp|mp4|mov|webm)$/i)?.[0]?.toLowerCase() || defaultExt

  const resolvedPath = (() => {
    if (target === 'custom') return customPath.replace(/^\/+/, '')
    if (needsFilename) {
      const safe = filename.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      return safe ? `${selected.path}${safe}${ext}` : ''
    }
    return `${selected.path}${ext}`
  })()

  const upload = async () => {
    setError('')
    setResult(null)
    setAdded(false)
    if (!file) {
      setError('Pick a file first.')
      return
    }
    if (!resolvedPath) {
      setError(needsFilename ? 'Give it a file name.' : 'Give it a path.')
      return
    }
    setBusy(true)
    try {
      const contentBase64 = await fileToBase64(file)
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, path: resolvedPath, contentBase64 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
      setResult(data.path)
    } catch (err) {
      setError(err.message || 'Failed to upload.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="h-fit border border-silver/15 bg-void-100 p-6 sm:p-8 lg:sticky lg:top-6">
      <h2 className="metal mb-1 flex items-center gap-2 font-display text-2xl">
        <ImageIcon size={18} className="text-flare" /> Photos &amp; videos
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-silver-mid">
        Uploads commit straight to GitHub too, under <code className="text-silver-hi">public/media</code>. A
        venue photo appears immediately. A gallery photo or video lets you drop it straight into the
        gallery list on the left once it's uploaded.
      </p>

      <div className="grid gap-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            What is this photo?
          </label>
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value)
              setResult(null)
              setAdded(false)
            }}
            className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 font-mono text-[12px] text-silver-hi outline-none transition-colors focus:border-flare"
          >
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {target === 'gallery-video' && (
          <p className="border border-flare/30 bg-void-000 p-3 font-mono text-[10px] leading-relaxed text-silver-mid">
            For anything longer than a few seconds, upload it to YouTube (unlisted is fine) instead — add a
            night in the gallery editor on the left and paste the video's link into its{' '}
            <code className="text-silver-hi">youtube</code> field. No upload needed, and it plays far more
            reliably than a self-hosted file.
          </p>
        )}

        {needsFilename && (
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
              File name
            </label>
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. nye-2026"
              className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 font-mono text-[12px] text-silver-hi outline-none transition-colors placeholder:text-silver-lo focus:border-flare"
            />
          </div>
        )}

        {target === 'custom' && (
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
              Path under /public
            </label>
            <input
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="media/venues/mercii.jpg"
              className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 font-mono text-[12px] text-silver-hi outline-none transition-colors placeholder:text-silver-lo focus:border-flare"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            {selected.kind === 'video'
              ? 'File — MP4 or MOV, under 20MB'
              : selected.kind === 'image'
                ? 'File — JPG, PNG or WebP, under 8MB'
                : 'File — photo or video'}
          </label>
          <input
            type="file"
            accept={
              selected.kind === 'video'
                ? 'video/mp4,video/quicktime,video/webm'
                : selected.kind === 'image'
                  ? 'image/jpeg,image/png,image/webp'
                  : 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm'
            }
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setResult(null)
              setAdded(false)
            }}
            className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 font-mono text-[12px] text-silver-hi outline-none file:mr-3 file:border-0 file:bg-flare file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-widest2 file:text-void-000"
          />
        </div>

        {resolvedPath && (
          <p className="font-mono text-[10px] text-silver-lo">
            Will upload to <span className="text-silver-hi">/public/{resolvedPath}</span>
          </p>
        )}

        {error && <p className="text-xs text-flare">{error}</p>}
        {result && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={13} /> Uploaded as <span className="text-silver-hi">{result}</span>
          </p>
        )}

        {result && isGallery && !added && (
          <VoidButton
            size="sm"
            variant="ghost"
            onClick={() => {
              onAddGalleryItem(target === 'gallery-photo' ? { poster: result } : { video: result })
              setAdded(true)
            }}
          >
            <Plus size={13} /> Add to gallery below
          </VoidButton>
        )}
        {added && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={13} /> Added — give it a title and venue in the gallery list, then publish.
          </p>
        )}

        <VoidButton size="sm" onClick={upload} disabled={busy} className="w-full">
          <UploadCloud size={13} /> {busy ? 'Uploading…' : 'Upload'}
        </VoidButton>
      </div>
    </section>
  )
}
