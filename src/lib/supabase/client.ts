import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let _client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!_client) {
    _client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"
    )
  }
  return _client
}
