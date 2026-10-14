import type { SupabaseConfig } from '../supabase/config.ts'
import { describeIdentityError } from '../supabase/identity.ts'
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
    <section className="card" aria-labelledby="ready-title">
      <h2 id="ready-title">Bereit</h2>
      <p>
        Du bist anonym in diesem Browser angemeldet. Raum erstellen und Beitreten
        folgen in den nächsten Arbeitspaketen.
      </p>
      <p className="hint">
        Kennung dieses Browsers: <code>{state.identity.userId.slice(0, 8)}</code>
      </p>
    </section>
  )
}
