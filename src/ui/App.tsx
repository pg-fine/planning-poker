import { useEffect, useRef } from 'react'
import { readSupabaseConfig } from '../supabase/config.ts'
import { IdentityGate } from './IdentityGate.tsx'
import { usePathname } from './routing.ts'
import { SetupNotice } from './SetupNotice.tsx'

// Die Build-Konfiguration ändert sich zur Laufzeit nicht; einmal lesen genügt.
const configResult = readSupabaseConfig()

export default function App() {
  const pathname = usePathname()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Nach einem Seitenwechsel den Fokus an den Anfang des Inhalts setzen, damit Tastatur- und
  // Screenreader-Nutzende nicht im Nichts landen. Beim ersten Laden bleibt der Fokus unberührt.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    main.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Planning Poker</h1>
        <p className="page__subtitle">
          Gemeinsam schätzen – parallel zur Teams-Besprechung im Browser.
        </p>
      </header>

      <main className="page__main" ref={main} tabIndex={-1}>
        {configResult.status === 'ok' ? (
          <IdentityGate config={configResult.config} />
        ) : (
          <SetupNotice result={configResult} />
        )}
      </main>
    </div>
  )
}
