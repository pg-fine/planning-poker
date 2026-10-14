import { readSupabaseConfig } from '../supabase/config.ts'
import { IdentityGate } from './IdentityGate.tsx'
import { SetupNotice } from './SetupNotice.tsx'

// Die Build-Konfiguration ändert sich zur Laufzeit nicht; einmal lesen genügt.
const configResult = readSupabaseConfig()

export default function App() {
  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Planning Poker</h1>
        <p className="page__subtitle">
          Gemeinsam schätzen – parallel zur Teams-Besprechung im Browser.
        </p>
      </header>

      <main className="page__main">
        {configResult.status === 'ok' ? (
          <IdentityGate config={configResult.config} />
        ) : (
          <SetupNotice result={configResult} />
        )}
      </main>
    </div>
  )
}
