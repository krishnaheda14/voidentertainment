import { useEffect, useRef, useState } from 'react'
import { Lock, Check, Trash2, UploadCloud, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import {
  week as defaultWeek,
  weekLabel as defaultWeekLabel,
  brand as defaultBrand,
  venues,
} from '../data/site'
import {
  checkLogin,
  isAdmin,
  setAdmin,
  logout,
  loadOverrides,
  saveOverrides,
  clearOverrides,
  notifyDataChanged,
  validateWeek,
} from '../lib/admin'
import { VoidButton } from './ui'
import logo from '../data/logo-mark.png'

function currentOverridesJson() {
  const o = loadOverrides()
  return JSON.stringify(
    {
      weekLabel: (o && o.weekLabel) || defaultWeekLabel,
      week: (o && o.week) || defaultWeek,
      brand: { ...defaultBrand, ...(o && o.brand ? o.brand : {}) },
    },
    null,
    2
  )
}

/* ==========================================================================
   ADMIN PAGE — a dedicated, bookmarkable /admin route (not a modal), so it
   has its own URL to hand to whoever manages the content day to day. Same
   login + publish mechanism as before: see src/lib/admin.js and
   api/save-content.js / functions/api/save-content.js for how a save
   actually reaches the live site.
   ========================================================================== */
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(isAdmin)
  // Kept in memory only (never persisted) so the API routes can re-verify
  // each publish/upload server-side. Cleared on logout or tab close.
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
      setAdmin()
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
  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr]">
      <ContentEditor creds={creds} />
      <ImageUploader creds={creds} />
      <button
        onClick={() => {
          logout()
          onLogout()
        }}
        className="font-mono text-[10px] uppercase tracking-widest2 text-silver-lo transition-colors hover:text-flare lg:col-span-2"
      >
        Log out
      </button>
    </div>
  )
}

function ContentEditor({ creds }) {
  const [text, setText] = useState(currentOverridesJson)
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

  const parse = () => {
    setError('')
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('That is not valid JSON.')
      return null
    }
    try {
      validateWeek(parsed.week)
    } catch (err) {
      setError(err.message)
      return null
    }
    return parsed
  }

  const preview = () => {
    const parsed = parse()
    if (!parsed) return
    saveOverrides(parsed)
    notifyDataChanged()
    flash('previewed')
  }

  const publish = async () => {
    const parsed = parse()
    if (!parsed) return

    saveOverrides(parsed)
    notifyDataChanged()
    flash('publishing')

    try {
      const res = await fetch('/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, ...parsed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Publish failed (${res.status})`)
      flash('published')
    } catch (err) {
      setError(err.message || 'Failed to publish.')
      flash('publish-error')
    }
  }

  const reset = () => {
    clearOverrides()
    notifyDataChanged()
    setText(currentOverridesJson())
    setError('')
    flash('previewed')
  }

  return (
    <section className="border border-silver/15 bg-void-100 p-6 sm:p-8">
      <h2 className="metal mb-1 font-display text-2xl">Schedule &amp; brand</h2>
      <p className="mb-4 text-xs leading-relaxed text-silver-mid">
        Edit <code className="text-silver-hi">weekLabel</code>, <code className="text-silver-hi">week</code> and{' '}
        <code className="text-silver-hi">brand</code> as JSON. <strong className="text-silver-hi">Publish live</strong>{' '}
        commits this straight to GitHub, which redeploys the site for everyone in about a minute.{' '}
        <strong className="text-silver-hi">Preview only</strong> just previews it in this browser.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={18}
        className="w-full resize-y border border-silver/15 bg-void-000 p-3 font-mono text-[11px] leading-relaxed text-silver-hi outline-none transition-colors focus:border-flare"
      />
      {error && <p className="mt-2 text-xs text-flare">{error}</p>}
      {!error && status === 'previewed' && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check size={13} /> Previewed in this browser only.
        </p>
      )}
      {!error && status === 'publishing' && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-silver-mid">
          <UploadCloud size={13} className="animate-pulse" /> Publishing to GitHub…
        </p>
      )}
      {!error && status === 'published' && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check size={13} /> Published. Live for everyone in ~1–2 minutes.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
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
   IMAGE UPLOADER
   Picks a photo, commits it straight to the exact /public/media path the
   site already expects (same GitHub publish pipeline as the content
   editor above) — so for a venue photo, nothing else needs to change for
   it to appear. For a gallery poster, the filename still needs adding to
   `pastNights` in the content editor above (or src/data/site.js by hand).
   ========================================================================== */
const TARGETS = [
  ...venues.map((v) => ({
    value: `venue:${v.slug}`,
    label: `${v.name} — venue photo`,
    path: `media/venues/${v.slug}`,
  })),
  { value: 'gallery', label: 'Past nights — gallery poster', path: 'media/gallery/' },
  { value: 'custom', label: 'Custom path (advanced)', path: '' },
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ImageUploader({ creds }) {
  const [target, setTarget] = useState(TARGETS[0].value)
  const [filename, setFilename] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const selected = TARGETS.find((t) => t.value === target)
  const ext = file?.name.match(/\.(jpe?g|png|webp)$/i)?.[0]?.toLowerCase() || '.jpg'

  const resolvedPath = (() => {
    if (target === 'custom') return customPath.replace(/^\/+/, '')
    if (target === 'gallery') {
      const safe = filename.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      return safe ? `media/gallery/${safe}${ext}` : ''
    }
    return `${selected.path}${ext}`
  })()

  const upload = async () => {
    setError('')
    setResult(null)
    if (!file) {
      setError('Pick a file first.')
      return
    }
    if (!resolvedPath) {
      setError(target === 'gallery' ? 'Give the poster a file name.' : 'Give it a path.')
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
    <section className="h-fit border border-silver/15 bg-void-100 p-6 sm:p-8">
      <h2 className="metal mb-1 flex items-center gap-2 font-display text-2xl">
        <ImageIcon size={18} className="text-flare" /> Photos
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-silver-mid">
        Uploads commit straight to GitHub too, under <code className="text-silver-hi">public/media</code>. A
        venue photo appears immediately — the site already points at that exact path. A gallery poster also
        needs its filename added to <code className="text-silver-hi">pastNights</code> in the editor on the
        left.
      </p>

      <div className="grid gap-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
            What is this photo?
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full border border-silver/15 bg-void-000 px-3 py-2.5 font-mono text-[12px] text-silver-hi outline-none transition-colors focus:border-flare"
          >
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {target === 'gallery' && (
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
            File — JPG or PNG, under 8MB
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
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

        <VoidButton size="sm" onClick={upload} disabled={busy} className="w-full">
          <UploadCloud size={13} /> {busy ? 'Uploading…' : 'Upload photo'}
        </VoidButton>
      </div>
    </section>
  )
}
