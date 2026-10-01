import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

import { Cursor, Nav, Preloader, Sparkles, WhatsAppFab } from './components/Chrome'
import Hero from './components/Hero'
import Schedule from './components/Schedule'
import Venues from './components/Venues'
import PastNights from './components/PastNights'
import { Ticker, Ledger, Process } from './components/Strip'
import { Book, Footer } from './components/Book'
import { Accordion } from './components/ui'
import { useSmoothScroll } from './lib/utils'

export default function App() {
  const [loading, setLoading] = useState(true)
  useSmoothScroll()

  const done = useCallback(() => setLoading(false), [])

  /* The orange light-leak follows the pointer. Throttled to one write per
     animation frame so it never fights the scroller. */
  useEffect(() => {
    let queued = false
    let x = 50
    let y = 30

    const write = () => {
      queued = false
      document.documentElement.style.setProperty('--lx', `${x}%`)
      document.documentElement.style.setProperty('--ly', `${y}%`)
    }

    const onMove = (e) => {
      x = (e.clientX / window.innerWidth) * 100
      y = (e.clientY / window.innerHeight) * 100
      if (!queued) {
        queued = true
        requestAnimationFrame(write)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="grain leak relative">
      <AnimatePresence>
        {loading && <Preloader key="preloader" onDone={done} />}
      </AnimatePresence>

      <Sparkles />
      <Cursor />
      <Nav />

      <main className="relative z-10">
        <Hero ready={!loading} />
        <Venues />
        <PastNights />
        <Schedule />
        <Book />

        <div className="shell pb-20 sm:pb-28">
          <Accordion
            label="More about Void"
            meta="The numbers, how it works, the room-by-room ticker"
          >
            <div className="-mx-6 -mt-8 space-y-2 sm:-mx-8">
              <Ticker />
              <Ledger />
              <Process />
            </div>
          </Accordion>
        </div>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  )
}
