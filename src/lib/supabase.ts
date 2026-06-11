import { createClient, SupabaseClient } from "@supabase/supabase-js"

/** Lazy factory — creates a new client on every call. Use in API routes. */
export function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Lazy singleton proxy — safe to import at module level.
 * The actual Supabase client is created only on first property access,
 * so env vars are not read at import / build time.
 */
let _instance: SupabaseClient | undefined
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    if (!_instance) {
      _instance = getSupabase()
    }
    const val = (_instance as any)[prop]
    return typeof val === "function" ? val.bind(_instance) : val
  },
})
