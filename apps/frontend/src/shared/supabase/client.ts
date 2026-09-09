import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

/**
 * null si faltan las env vars (dev local sin configurar, o tests) — el
 * login con Google simplemente no se ofrece en ese caso, no rompe nada.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  client = url && anonKey ? createClient(url, anonKey) : null
  return client
}
