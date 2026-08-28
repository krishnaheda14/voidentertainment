import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp,
  Instagram,
  Mail,
  MessageCircle,
  Minus,
  Phone,
  Plus,
} from 'lucide-react'
import { brand, faqs, venues, week } from '../data/site'
import { cx, scrollToId, waLink } from '../lib/utils'
import { Reveal, SectionHead, VoidButton } from './ui'

/* ==========================================================================
   FAQ
   ========================================================================== */
export function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section className="relative py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow={`Questions · ${faqs.length}`}
          title="Before you ask"
          meta="The things people message us about most. Anything not covered here, just ask the desk directly — it is faster than reading."
        />

        <div className="border-t border-silver/10">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <Reveal key={f.q} delay={i * 0.04}>
                <div className="border-b border-silver/10">
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span
                      className={cx(
                        'font-display text-[clamp(1.15rem,3.2vw,1.85rem)] uppercase leading-tight transition-colors duration-300',
                        isOpen ? 'text-flare' : 'metal group-hover:text-flare group-hover:[-webkit-text-fill-color:currentColor]'
                      )}
                    >
                      {f.q}
                    </span>
                    <span
                      className={cx(
                        'grid h-9 w-9 shrink-0 place-items-center border transition-all duration-300',
                        isOpen
                          ? 'border-flare bg-flare text-void-000'
                          : 'border-silver/20 text-silver group-hover:border-flare'
                      )}
                    >
                      {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-3xl pb-7 pr-12 text-[15px] leading-relaxed text-silver-mid">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ==========================================================================
   BOOKING COMPOSER
   No backend, no database, no form service. It writes the WhatsApp message
   for you and hands it to WhatsApp. Works on a static host, works offline
   the moment the page is loaded, and nothing can silently fail to deliver.
   ========================================================================== */
const KINDS = ['Guestlist', 'Table', 'Birthday', 'Corporate']

export function Book() {
  const [form, setForm] = useState({
    name: '',
    kind: 'Guestlist',
    venue: venues[0].name,
    night: week[4]?.long || 'Friday',
    heads: '4',
    date: '',
    notes: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const message = useMemo(() => {
    const l = [
      `Hi Void${form.name ? `, this is ${form.name}` : ''} — booking request.`,
      '',
      `Type: ${form.kind}`,
      `Venue: ${form.venue}`,
      `Night: ${form.night}${form.date ? ` (${form.date})` : ''}`,
      `Headcount: ${form.heads}`,
    ]
    if (form.notes) l.push(`Notes: ${form.notes}`)
    l.push('', 'Sent from voidentertainment.in')
    return l.join('\n')
  }, [form])

  const field =
    'w-full border border-silver/15 bg-void-100 px-4 py-3.5 font-mono text-[13px] text-silver-hi outline-none transition-colors placeholder:text-silver-lo focus:border-flare'

  return (
    <section id="book" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <SectionHead
          eyebrow="Book · WhatsApp only"
          title="Send it to the desk"
          meta="Fill this in and it writes the message for you. You still send it yourself from your own WhatsApp, so you have the thread and we have your number."
        />

        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          {/* the form */}
          <Reveal className="panel p-6 sm:p-8">
            <div className="grid gap-5">
              <div>
                <label htmlFor="f-name" className="eyebrow mb-2 block">
                  Your name
                </label>
                <input
                  id="f-name"
                  className={field}
                  placeholder="Who should we ask for at the door?"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>

              <div>
                <span className="eyebrow mb-2 block">What do you need?</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      onClick={() => setForm((f) => ({ ...f, kind: k }))}
                      className={cx(
                        'border px-3 py-3 font-mono text-[10px] uppercase tracking-widest2 transition-all duration-300',
                        form.kind === k
                          ? 'border-flare bg-flare text-void-000'
                          : 'border-silver/15 text-silver-mid hover:border-silver/40 hover:text-silver-hi'
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-venue" className="eyebrow mb-2 block">
                    Venue
                  </label>
                  <select id="f-venue" className={field} value={form.venue} onChange={set('venue')}>
                    {venues.map((v) => (
                      <option key={v.slug} value={v.name}>
                        {v.name} — {v.area}
                      </option>
                    ))}
                    <option value="Not sure — recommend one">
                      Not sure — recommend one
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="f-night" className="eyebrow mb-2 block">
                    Night
                  </label>
                  <select id="f-night" className={field} value={form.night} onChange={set('night')}>
                    {week.map((d) => (
                      <option key={d.day} value={d.long}>
                        {d.long}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="f-date" className="eyebrow mb-2 block">
                    Date
                  </label>
                  <input
                    id="f-date"
                    type="date"
                    className={cx(field, '[color-scheme:dark]')}
                    value={form.date}
                    onChange={set('date')}
                  />
                </div>

                <div>
                  <label htmlFor="f-heads" className="eyebrow mb-2 block">
                    Headcount
                  </label>
                  <input
                    id="f-heads"
                    type="number"
                    min="1"
                    max="200"
                    className={field}
                    value={form.heads}
                    onChange={set('heads')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="f-notes" className="eyebrow mb-2 block">
                  Anything else
                </label>
                <textarea
                  id="f-notes"
                  rows={3}
                  className={cx(field, 'resize-none')}
                  placeholder="Stag ratio, budget, cake, sea-facing table…"
                  value={form.notes}
                  onChange={set('notes')}
                />
              </div>

              <VoidButton href={waLink(message)} size="lg" className="w-full">
                <MessageCircle size={15} strokeWidth={2.5} />
                Open WhatsApp with this message
              </VoidButton>

              <p className="font-mono text-[10px] leading-relaxed text-silver-lo">
                Nothing is stored on this site. The button hands the message to
                WhatsApp — you press send.
              </p>
            </div>
          </Reveal>

          {/* live preview + direct contacts */}
          <div className="grid content-start gap-6">
            <Reveal delay={0.08}>
              <div className="panel p-6 sm:p-8">
                <div className="eyebrow mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-blink bg-flare" />
                  Message preview
                </div>
                <pre className="whitespace-pre-wrap break-words border-l-2 border-flare/50 bg-void-000 p-5 font-mono text-[12px] leading-relaxed text-silver">
                  {message}
                </pre>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="panel p-6 sm:p-8">
                <div className="eyebrow mb-5">Or reach us directly</div>
                <ul className="grid gap-4">
                  <li>
                    <a
                      href={waLink('Hi Void —')}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center gap-4"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center border border-silver/15 text-flare transition-colors group-hover:border-flare group-hover:bg-flare group-hover:text-void-000">
                        <Phone size={15} />
                      </span>
                      <span>
                        <span className="block font-mono text-[13px] text-silver-hi">
                          {brand.whatsappLabel}
                        </span>
                        <span className="block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
                          WhatsApp — {brand.hours}
                        </span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${brand.email}`} className="group flex items-center gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center border border-silver/15 text-flare transition-colors group-hover:border-flare group-hover:bg-flare group-hover:text-void-000">
                        <Mail size={15} />
                      </span>
                      <span>
                        <span className="block font-mono text-[13px] text-silver-hi">
                          {brand.email}
                        </span>
                        <span className="block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
                          Corporate and press
                        </span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={brand.instagram}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center gap-4"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center border border-silver/15 text-flare transition-colors group-hover:border-flare group-hover:bg-flare group-hover:text-void-000">
                        <Instagram size={15} />
                      </span>
                      <span>
                        <span className="block font-mono text-[13px] text-silver-hi">
                          {brand.instagramHandle}
                        </span>
                        <span className="block font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
                          Nightly stories from the floor
                        </span>
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ==========================================================================
   FOOTER
   ========================================================================== */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-silver/10 pt-16">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="max-w-md text-[15px] leading-relaxed text-silver-mid">
              Void Entertainment runs guestlists, tables and private nights across{' '}
              {brand.city}. Five house rooms, seven nights, one number.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <VoidButton href={waLink('Hi Void —')} size="sm">
                <MessageCircle size={13} strokeWidth={2.5} />
                {brand.whatsappLabel}
              </VoidButton>
              <VoidButton href={brand.instagram} size="sm" variant="ghost">
                <Instagram size={13} />
                Instagram
              </VoidButton>
            </div>
          </div>

          <button
            onClick={() => scrollToId('top')}
            className="group flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo transition-colors hover:text-flare"
          >
            <span className="grid h-10 w-10 place-items-center border border-silver/15 transition-colors group-hover:border-flare">
              <ArrowUp size={15} />
            </span>
            Back to the top
          </button>
        </div>

        {/* the wordmark, cropped by the viewport edge like signage */}
        <div className="pointer-events-none mt-12 select-none overflow-hidden">
          <span className="metal block whitespace-nowrap font-display text-[clamp(4rem,21vw,17rem)] leading-[0.78] tracking-tightest">
            VOID
          </span>
        </div>

        <div className="rule" />
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">
          <span>
            © {new Date().getFullYear()} {brand.full} · {brand.city}
          </span>
          <span>Drink responsibly · 21+ at every venue</span>
          <span>{brand.domain}</span>
        </div>
      </div>
    </footer>
  )
}
