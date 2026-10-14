import { readSupabaseConfig } from '../supabase/config.ts'
import { SetupNotice } from './SetupNotice.tsx'

export default function App() {
  const configResult = readSupabaseConfig()

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
          <section className="card" aria-labelledby="ready-title">
            <h2 id="ready-title">Bereit</h2>
            <p>
              Die Verbindung zu Supabase ist konfiguriert. Raum erstellen und
              Beitreten folgen in den nächsten Arbeitspaketen.
            </p>
          </section>
        ) : (
          <SetupNotice result={configResult} />
        )}
      </main>
    </div>
  )
}
