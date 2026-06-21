import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"
import { getTenantSlug, getTenantBySlug } from "@/lib/tenant"

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const slug = await getTenantSlug()
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: existing } = await supabase.from("users").select("id").eq("email", email).eq("tenant_id", tenant.id).single()
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const bcrypt = await import("bcryptjs")
    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabase
      .from("users")
      .insert({ name, email, password_hash, role: "client", tenant_id: tenant.id })
      .select("id, email, name, role, tenant_id")
      .single()

    if (error || !user) {
      console.error("[register] Supabase error:", error?.message, error?.code, error?.details)
      const msg = error?.code === "42P01"
        ? "Database tables not set up — run the SQL schema in Supabase"
        : "Failed to create account"
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: "client", tenant_id: tenant.id })
    return NextResponse.json({ role: "client" })
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
