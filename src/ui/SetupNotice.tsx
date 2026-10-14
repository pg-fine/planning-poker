import type { SupabaseConfigResult } from '../supabase/config.ts'

type Props = {
  result: Exclude<SupabaseConfigResult, { status: 'ok' }>
}

export function SetupNotice({ result }: Props) {
  return (
    <section className="card card--notice" aria-labelledby="setup-title">
      <h2 id="setup-title">Einrichtung erforderlich</h2>

      {result.status === 'missing' ? (
        <p>
          Die App ist noch nicht mit einem Supabase-Projekt verbunden. Es
          fehlen folgende Einstellungen:{' '}
          {result.missing.map((name, index) => (
            <span key={name}>
              {index > 0 ? ', ' : ''}
              <code>{name}</code>
            </span>
          ))}
          .
        </p>
      ) : (
        <p>Die Supabase-Konfiguration ist fehlerhaft: {result.reason}</p>
      )}

      <ol>
        <li>
          Kopiere <code>.env.example</code> nach <code>.env.local</code>.
        </li>
        <li>
          Trage dort die Projekt-URL und den öffentlichen Publishable-/Anon-Key
          deines Supabase-Projekts ein.
        </li>
        <li>
          Starte den Entwicklungsserver mit <code>npm run dev</code> neu.
        </li>
      </ol>
      <p className="hint">
        Verwende niemals einen Service-Role- oder Secret-Key im Frontend.
      </p>
    </section>
  )
}
