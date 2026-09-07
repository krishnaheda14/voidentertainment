import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, X, Check, Trash2 } from 'lucide-react'
import { week as defaultWeek, weekLabel as defaultWeekLabel, brand as defaultBrand } from '../data/site'
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

export default function AdminPanel() {
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(isAdmin)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('void:admin-open', onOpen)
    return () => window.removeEventListener('void:admin-open', onOpen)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-void-000/90 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <motion.div
          className="w-full max-w-lg border border-silver/15 bg-void-100 shadow-2xl"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between border-b border-silver/10 px-5 py-4">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest2 text-silver-mid">
              <Lock size={13} className="text-flare" /> Admin
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center text-silver-lo transition-colors hover:text-flare"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {loggedIn ? (
            <EditPanel onLogout={() => setLoggedIn(false)} onClose={() => setOpen(false)} />
          ) : (
            <LoginForm onSuccess={() => setLoggedIn(true)} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
    const ok = await checkLogin(id.trim(), password)
    setBusy(false)
    if (ok) {
      setAdmin()
      onSuccess()
    } else {
      setError('Wrong ID or password.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 py-6">
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

function EditPanel({ onLogout, onClose }) {
  const [text, setText] = useState(currentOverridesJson)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = () => {
    setSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 1800)
  }

  const save = () => {
    setError('')
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('That is not valid JSON.')
      return
    }
    try {
      validateWeek(parsed.week)
    } catch (err) {
      setError(err.message)
      return
    }
    saveOverrides(parsed)
    notifyDataChanged()
    flash()
  }

  const reset = () => {
    clearOverrides()
    notifyDataChanged()
    setText(currentOverridesJson())
    setError('')
    flash()
  }

  return (
    <div className="px-5 py-5">
      <p className="mb-3 text-xs leading-relaxed text-silver-mid">
        Edit <code className="text-silver-hi">weekLabel</code>, <code className="text-silver-hi">week</code> and{' '}
        <code className="text-silver-hi">brand</code> as JSON. Saving previews live in this browser only —
        paste the JSON into <code className="text-silver-hi">src/data/site.js</code> and redeploy for everyone
        else to see it.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={14}
        className="w-full resize-y border border-silver/15 bg-void-000 p-3 font-mono text-[11px] leading-relaxed text-silver-hi outline-none transition-colors focus:border-flare"
      />
      {error && <p className="mt-2 text-xs text-flare">{error}</p>}
      {saved && !error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check size={13} /> Saved to this browser.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <VoidButton size="sm" onClick={save}>
          <Check size={13} /> Save
        </VoidButton>
        <VoidButton size="sm" variant="ghost" onClick={reset}>
          <Trash2 size={13} /> Reset to defaults
        </VoidButton>
        <button
          onClick={() => {
            logout()
            onLogout()
          }}
          className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-silver-lo transition-colors hover:text-flare"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
