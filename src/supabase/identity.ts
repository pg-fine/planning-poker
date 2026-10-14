import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js'
import type { AppSupabaseClient } from './client.ts'

export type Identity = {
  /** Auth ID of the anonymous browser identity (`auth.uid()` in the database). */
  userId: string
}

export type IdentityErrorKind =
  /** Anonymous sign-in is not enabled in the Supabase project. */
  | 'anonymous_disabled'
  /** Too many sign-ins (limit per IP address). */
  | 'rate_limited'
  /** Supabase unreachable (offline, paused project, blocked). */
  | 'network'
  | 'unknown'

export class IdentityError extends Error {
  readonly kind: IdentityErrorKind

  constructor(kind: IdentityErrorKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'IdentityError'
    this.kind = kind
  }
}

const LOCK_NAME = 'planning-poker:identity'

/**
 * Serializes initialization across all tabs of the same browser profile. Without a lock, two
 * tabs opened at the same time without a session could both sign in anonymously and overwrite
 * each other's session (two identities for one person).
 */
async function withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(LOCK_NAME, task)
  }
  return task()
}

function classify(error: AuthError): IdentityError {
  if (isAuthRetryableFetchError(error) || error.status === 0) {
    return new IdentityError(
      'network',
      'Supabase is unreachable.',
      { cause: error },
    )
  }
  if (error.code === 'anonymous_provider_disabled') {
    return new IdentityError(
      'anonymous_disabled',
      'Anonymous sign-in is not enabled in the Supabase project.',
      { cause: error },
    )
  }
  if (
    error.code === 'over_request_rate_limit' ||
    error.code === 'over_email_send_rate_limit' ||
    error.status === 429
  ) {
    return new IdentityError(
      'rate_limited',
      'Too many sign-ins from this network address.',
      { cause: error },
    )
  }
  return new IdentityError('unknown', error.message, { cause: error })
}

async function initialize(client: AppSupabaseClient): Promise<Identity> {
  const { data: sessionData, error: sessionError } =
    await client.auth.getSession()
  if (sessionError && isAuthRetryableFetchError(sessionError)) {
    throw classify(sessionError)
  }

  if (sessionData.session) {
    // getSession() only reads locally. getUser() asks the server and detects sessions whose
    // user has been deleted in the meantime or whose token is no longer valid.
    const { data: userData, error: userError } = await client.auth.getUser()
    if (userData.user) return { userId: userData.user.id }
    if (userError && isAuthRetryableFetchError(userError)) {
      throw classify(userError)
    }
    // Invalid session: discard locally and sign in anonymously again.
    await client.auth.signOut({ scope: 'local' })
  }

  const { data, error } = await client.auth.signInAnonymously()
  if (error) throw classify(error)
  if (!data.user) {
    throw new IdentityError('unknown', 'Sign-in returned no user.')
  }
  return { userId: data.user.id }
}

let inFlight: Promise<Identity> | undefined

/**
 * Ensures an anonymous identity: reuse an existing session, otherwise sign in anonymously.
 * Concurrent calls within the app share one operation; across tabs a browser lock keeps
 * things in order. Failed operations are not cached; a new call tries again.
 */
export function ensureIdentity(client: AppSupabaseClient): Promise<Identity> {
  inFlight ??= withCrossTabLock(() => initialize(client)).finally(() => {
    inFlight = undefined
  })
  return inFlight
}

/** Message and next step for the user interface. */
export function describeIdentityError(error: unknown): {
  title: string
  hint: string
} {
  const kind = error instanceof IdentityError ? error.kind : 'unknown'
  switch (kind) {
    case 'anonymous_disabled':
      return {
        title: 'Anonymous sign-in is not enabled.',
        hint: 'In the Supabase dashboard, enable "Allow anonymous sign-ins" under "Authentication → Sign In / Providers" and try again.',
      }
    case 'rate_limited':
      return {
        title: 'Too many sign-ins from this network address.',
        hint: 'Wait a few minutes and try again. You can raise the limit in the Supabase dashboard under "Authentication → Rate Limits".',
      }
    case 'network':
      return {
        title: 'Supabase is unreachable.',
        hint: 'Check your internet connection. A free Supabase project is paused after a longer period of inactivity and must be reactivated in the dashboard. A corporate network can also block the connection.',
      }
    default:
      return {
        title: 'Sign-in failed.',
        hint: 'Try again. If the problem persists, check the URL and publishable key in the configuration.',
      }
  }
}
