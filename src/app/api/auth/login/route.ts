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

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find all users with this email across all tenants
  const { data: matches } = await supabase
    .from("users")
    .select("id, email, name, role, password_hash, tenant_id")
    .eq("email", email)

  if (!matches || matches.length === 0) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // Verify password against first match (password is the same across tenants for the same person)
  const bcrypt = await import("bcryptjs")
  const valid = await bcrypt.compare(password, matches[0].password_hash ?? "")
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // If user belongs to only one tenant, log in directly
  if (matches.length === 1) {
    const user = matches[0]
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id })
    return NextResponse.json({ role: user.role })
  }

  // Multiple tenants — return workspace list for picker
  // Fetch tenant details for each membership
  const tenantIds = matches.map(m => m.tenant_id)
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, primary_color, industry")
    .in("id", tenantIds)

  const workspaces = matches.map(m => {
    const t = tenants?.find(t => t.id === m.tenant_id)
    return {
      userId: m.id,
      tenantId: m.tenant_id,
      role: m.role,
      name: t?.name ?? m.tenant_id,
      slug: t?.slug ?? "",
      primary_color: t?.primary_color ?? "#6366f1",
      industry: t?.industry ?? "",
    }
  })

  return NextResponse.json({ choose: true, workspaces })
}
