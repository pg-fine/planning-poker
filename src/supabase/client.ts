import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseConfig } from './config.ts'

export type AppSupabaseClient = SupabaseClient

let cached: { key: string; client: AppSupabaseClient } | undefined

/**
 * Liefert den gemeinsamen Supabase-Client der App. Pro Browser-Fenster gibt es genau einen
 * Client, damit nicht mehrere Auth-Instanzen um dieselbe gespeicherte Session konkurrieren.
 * Die Session liegt im localStorage und wird zwischen Tabs desselben Profils geteilt.
 */
export function getSupabaseClient(config: SupabaseConfig): AppSupabaseClient {
  const key = `${config.url}|${config.publishableKey}`
  if (cached?.key === key) return cached.client

  const client = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Es gibt keine OAuth-Weiterleitungen; die URL (Raum-Links) darf nicht angefasst werden.
      detectSessionInUrl: false,
    },
  })
  cached = { key, client }
  return client
}
