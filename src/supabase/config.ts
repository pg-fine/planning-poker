export type SupabaseConfig = {
  url: string
  publishableKey: string
}

export type SupabaseConfigResult =
  | { status: 'ok'; config: SupabaseConfig }
  | { status: 'missing'; missing: string[] }
  | { status: 'invalid'; reason: string }

const PLACEHOLDER_URL = 'https://dein-projekt.supabase.co'
const PLACEHOLDER_KEY = 'dein-publishable-key'

/**
 * Liest die oeffentliche Supabase-Konfiguration aus den Build-Variablen.
 * Es werden nur Projekt-URL und Publishable-/Anon-Key erwartet, niemals geheime Schluessel.
 */
export function readSupabaseConfig(
  env: ImportMetaEnv = import.meta.env,
): SupabaseConfigResult {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  const missing: string[] = []
  if (!url || url === PLACEHOLDER_URL) missing.push('VITE_SUPABASE_URL')
  if (!publishableKey || publishableKey === PLACEHOLDER_KEY) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  if (missing.length > 0 || !url || !publishableKey) {
    return { status: 'missing', missing }
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return {
        status: 'invalid',
        reason: 'VITE_SUPABASE_URL muss mit https:// beginnen.',
      }
    }
  } catch {
    return {
      status: 'invalid',
      reason: 'VITE_SUPABASE_URL ist keine gültige URL.',
    }
  }

  return { status: 'ok', config: { url, publishableKey } }
}
