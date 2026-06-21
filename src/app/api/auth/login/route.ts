import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"
import { getTenantSlug, getTenantBySlug } from "@/lib/tenant"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@0tox2026"

  // Super-admin hardcoded account
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const slug = await getTenantSlug()
    const tenant = await getTenantBySlug(slug)
    await createSession({ id: "admin", email, name: "Admin", role: "admin", tenant_id: tenant?.id ?? "" })
    return NextResponse.json({ role: "admin" })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  // Accounts are bound to a subdomain: only match users that belong to the
  // tenant of the host being visited. A site9.in/cafe owner therefore cannot
  // sign in on the main marketing site (or any other subdomain) — they must use
  // their own subdomain, where this lookup resolves to their tenant.
  const slug = await getTenantSlug()
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, role, password_hash, tenant_id")
    .eq("email", email)
    .eq("tenant_id", tenant.id)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  const bcrypt = await import("bcryptjs")
  const valid = await bcrypt.compare(password, user.password_hash ?? "")
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id })
  return NextResponse.json({ role: user.role })
}
