import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"

export async function POST(req: Request) {
  const { email, password, tenantId } = await req.json()
  if (!email || !password || !tenantId) {
    return NextResponse.json({ error: "email, password and tenantId required" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, role, password_hash, tenant_id")
    .eq("email", email)
    .eq("tenant_id", tenantId)
    .single()

  if (!user?.password_hash) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const bcrypt = await import("bcryptjs")
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id })
  return NextResponse.json({ role: user.role })
}
