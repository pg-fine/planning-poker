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
        <p>Signing in …</p>
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
          Try again
        </button>
      </section>
    )
  }

  return (
    <>
      <AppRoutes client={getSupabaseClient(config)} />
      <details className="hint footer">
        <summary>Help on browser and participation</summary>
        <p>
          This browser keeps its participation (ID <code>{state.identity.userId.slice(0, 8)}</code>
          ). In another browser, on another device or after clearing the browser data,
          you count as a new person and join the room again.
        </p>
      </details>
    </>
  )
}
