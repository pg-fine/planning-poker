import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js'
import type { AppSupabaseClient } from './client.ts'

export type Identity = {
  /** Auth-ID der anonymen Browser-Identität (`auth.uid()` in der Datenbank). */
  userId: string
}

export type IdentityErrorKind =
  /** Anonyme Anmeldung ist im Supabase-Projekt nicht aktiviert. */
  | 'anonymous_disabled'
  /** Zu viele Anmeldungen (Limit pro IP-Adresse). */
  | 'rate_limited'
  /** Supabase nicht erreichbar (offline, pausiertes Projekt, blockiert). */
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
 * Serialisiert die Initialisierung über alle Tabs desselben Browser-Profils. Ohne Sperre
 * könnten zwei gleichzeitig geöffnete Tabs ohne Session beide anonym anmelden und sich
 * gegenseitig die Session überschreiben (zwei Identitäten für eine Person).
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
      'Supabase ist nicht erreichbar.',
      { cause: error },
    )
  }
  if (error.code === 'anonymous_provider_disabled') {
    return new IdentityError(
      'anonymous_disabled',
      'Anonyme Anmeldung ist im Supabase-Projekt nicht aktiviert.',
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
      'Zu viele Anmeldungen von dieser Netzwerkadresse.',
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
    // getSession() liest nur lokal. getUser() fragt den Server und erkennt Sessions, deren
    // Nutzer inzwischen gelöscht wurde oder deren Token nicht mehr gültig ist.
    const { data: userData, error: userError } = await client.auth.getUser()
    if (userData.user) return { userId: userData.user.id }
    if (userError && isAuthRetryableFetchError(userError)) {
      throw classify(userError)
    }
    // Ungültige Session: lokal verwerfen und neu anonym anmelden.
    await client.auth.signOut({ scope: 'local' })
  }

  const { data, error } = await client.auth.signInAnonymously()
  if (error) throw classify(error)
  if (!data.user) {
    throw new IdentityError('unknown', 'Anmeldung lieferte keinen Nutzer.')
  }
  return { userId: data.user.id }
}

let inFlight: Promise<Identity> | undefined

/**
 * Stellt eine anonyme Identität sicher: vorhandene Session wiederverwenden, sonst anonym
 * anmelden. Gleichzeitige Aufrufe innerhalb der App teilen sich einen Vorgang; über Tabs
 * hinweg sorgt eine Browser-Sperre für Ordnung. Fehlgeschlagene Vorgänge werden nicht
 * zwischengespeichert, ein erneuter Aufruf versucht es neu.
 */
export function ensureIdentity(client: AppSupabaseClient): Promise<Identity> {
  inFlight ??= withCrossTabLock(() => initialize(client)).finally(() => {
    inFlight = undefined
  })
  return inFlight
}

/** Deutsche Meldung und nächster Schritt für die Oberfläche. */
export function describeIdentityError(error: unknown): {
  title: string
  hint: string
} {
  const kind = error instanceof IdentityError ? error.kind : 'unknown'
  switch (kind) {
    case 'anonymous_disabled':
      return {
        title: 'Anonyme Anmeldung ist nicht aktiviert.',
        hint: 'Aktiviere im Supabase-Dashboard unter „Authentication → Sign In / Providers“ die Option „Allow anonymous sign-ins“ und versuche es erneut.',
      }
    case 'rate_limited':
      return {
        title: 'Zu viele Anmeldungen von dieser Netzwerkadresse.',
        hint: 'Warte einige Minuten und versuche es erneut. Das Limit lässt sich im Supabase-Dashboard unter „Authentication → Rate Limits“ erhöhen.',
      }
    case 'network':
      return {
        title: 'Supabase ist nicht erreichbar.',
        hint: 'Prüfe die Internetverbindung. Ein kostenloses Supabase-Projekt wird nach längerer Inaktivität pausiert und muss im Dashboard wieder aktiviert werden. Auch ein Firmennetz kann die Verbindung blockieren.',
      }
    default:
      return {
        title: 'Die Anmeldung ist fehlgeschlagen.',
        hint: 'Versuche es erneut. Besteht das Problem weiter, prüfe URL und Publishable Key in der Konfiguration.',
      }
  }
}
