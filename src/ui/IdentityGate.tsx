import type { SupabaseConfig } from '../supabase/config.ts'
import { describeIdentityError } from '../supabase/identity.ts'
import { getSupabaseClient } from '../supabase/client.ts'
import { AppRoutes } from './AppRoutes.tsx'
import { useIdentity } from './useIdentity.ts'

type Props = { config: SupabaseConfig }

export function IdentityGate({ config }: Props) {
  const { state, retry } = useIdentity(config)

  if (state.status === 'loading') {
    return (
      <section className="card" aria-live="polite">
        <p>Anmeldung läuft …</p>
      </section>
    )
  }

  if (state.status === 'error') {
    const { title, hint } = describeIdentityError(state.error)
    return (
      <section className="card card--notice" role="alert">
        <h2>{title}</h2>
        <p>{hint}</p>
        <button type="button" onClick={retry}>
          Erneut versuchen
        </button>
      </section>
    )
  }

  return (
    <>
      <AppRoutes client={getSupabaseClient(config)} />
      <details className="hint footer">
        <summary>Hilfe zu Browser und Teilnahme</summary>
        <p>
          Dieser Browser behält seine Teilnahme (Kennung <code>{state.identity.userId.slice(0, 8)}</code>
          ). In einem anderen Browser, auf einem anderen Gerät oder nach dem Löschen der
          Browserdaten giltst du als neue Person und trittst dem Raum erneut bei.
        </p>
      </details>
    </>
  )
}
