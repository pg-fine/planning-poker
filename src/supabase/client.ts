import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseConfig } from './config.ts'

export type AppSupabaseClient = SupabaseClient

let cached: { key: string; client: AppSupabaseClient } | undefined

/**
 * Returns the app's shared Supabase client. There is exactly one client per browser window so
 * that multiple auth instances do not compete for the same stored session. The session lives
 * in localStorage and is shared between tabs of the same profile.
 */
export function getSupabaseClient(config: SupabaseConfig): AppSupabaseClient {
  const key = `${config.url}|${config.publishableKey}`
  if (cached?.key === key) return cached.client

  const client = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // There are no OAuth redirects; the URL (room links) must not be touched.
      detectSessionInUrl: false,
    },
  })
  cached = { key, client }
  return client
}
