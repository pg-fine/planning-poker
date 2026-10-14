import { useCallback, useEffect, useState } from 'react'
import type { SupabaseConfig } from '../supabase/config.ts'
import { getSupabaseClient } from '../supabase/client.ts'
import { ensureIdentity, type Identity } from '../supabase/identity.ts'

export type IdentityState =
  | { status: 'loading' }
  | { status: 'ready'; identity: Identity }
  | { status: 'error'; error: unknown }

/** Meldet den Browser anonym an (oder stellt die gespeicherte Identität wieder her). */
export function useIdentity({ url, publishableKey }: SupabaseConfig) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<IdentityState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const client = getSupabaseClient({ url, publishableKey })
    ensureIdentity(client).then(
      (identity) => {
        if (!cancelled) setState({ status: 'ready', identity })
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'error', error })
      },
    )
    return () => {
      cancelled = true
    }
  }, [url, publishableKey, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}
