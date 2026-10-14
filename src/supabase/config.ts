export type SupabaseConfig = {
  url: string
  publishableKey: string
}

export type SupabaseConfigResult =
  | { status: 'ok'; config: SupabaseConfig }
  | { status: 'missing'; missing: string[] }
  | { status: 'invalid'; reason: string }

const PLACEHOLDER_URL = 'https://your-project.supabase.co'
const PLACEHOLDER_KEY = 'your-publishable-key'

/**
 * Reads the public Supabase configuration from the build variables.
 * Only the project URL and the publishable/anon key are expected, never secret keys.
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
        reason: 'VITE_SUPABASE_URL must start with https://.',
      }
    }
  } catch {
    return {
      status: 'invalid',
      reason: 'VITE_SUPABASE_URL is not a valid URL.',
    }
  }

  return { status: 'ok', config: { url, publishableKey } }
}
