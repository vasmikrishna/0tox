import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (!_client) {
    _client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"
    )
  }
  return _client
}
