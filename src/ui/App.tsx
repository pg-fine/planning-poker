import { useEffect, useRef } from 'react'
import { readSupabaseConfig } from '../supabase/config.ts'
import { IdentityGate } from './IdentityGate.tsx'
import { usePathname } from './routing.ts'
import { SetupNotice } from './SetupNotice.tsx'

// The build configuration does not change at runtime; reading it once is enough.
const configResult = readSupabaseConfig()

export default function App() {
  const pathname = usePathname()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)

  // After a page change, move focus to the start of the content so keyboard and screen reader
  // users do not end up nowhere. On the first load the focus is left untouched.
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
          Estimate together – in the browser, alongside your Teams meeting.
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
