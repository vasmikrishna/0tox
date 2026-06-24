import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createSession } from "@/lib/session"
import { getTenantSlug, getTenantBySlug } from "@/lib/tenant"

export async function POST(req: Request) {
  const { email, password, phone } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  // Issue #9: the login form optionally collects a phone number. Login itself
  // stays email + password — we just persist the phone onto the matched
  // user(s) once their credentials check out (migration 017 adds the column).
  const phoneToStore = typeof phone === "string" ? phone.trim() : ""

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@0tox2026"

  // Super-admin hardcoded account
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const slug = await getTenantSlug()
    const tenant = await getTenantBySlug(slug)
    await createSession({ id: "admin", email, name: "Admin", role: "admin", tenant_id: tenant?.id ?? "" })
    return NextResponse.json({ role: "admin", superadmin: true })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseKey)
  const bcrypt = await import("bcryptjs")

  // Where is the user signing in?
  //  - On a tenant's own subdomain/custom domain → bind login to THAT tenant,
  //    so one tenant's login page can't authenticate into another.
  //  - On the main site (site9.in) → global login: find the account across all
  //    tenants and send the owner to their own workspace.
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"
  const host = ((await headers()).get("host") ?? "").split(":")[0].toLowerCase()
  const isMainDomain =
    host === baseDomain ||
    host === `www.${baseDomain}` ||
    host === "localhost" ||
    host === "127.0.0.1"

  // ── Subdomain / custom-domain login: bound to the current tenant ──────────
  if (!isMainDomain) {
    const slug = await getTenantSlug()
    const tenant = await getTenantBySlug(slug)
    if (!tenant) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
      .from("users")
      .select("id, email, name, role, password_hash, tenant_id")
      .eq("email", email)
      .eq("tenant_id", tenant.id)
      .maybeSingle()

    if (!user || !(await bcrypt.compare(password, user.password_hash ?? ""))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (phoneToStore) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("users").update({ phone: phoneToStore }).eq("id", user.id)
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id })
    return NextResponse.json({ role: user.role, onboarding_complete: tenant.onboarding_complete ?? false, slug: tenant.slug })
  }

  // ── Main-domain login: resolve the account across ALL tenants ─────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase as any)
    .from("users")
    .select("id, email, name, role, password_hash, tenant_id")
    .eq("email", email)

  // Verify the password against each candidate (the same email can exist in
  // several tenants with different passwords).
  const matched: Array<{ id: string; email: string; name: string; role: string; tenant_id: string }> = []
  for (const u of rows ?? []) {
    if (u.password_hash && (await bcrypt.compare(password, u.password_hash))) matched.push(u)
  }
  if (matched.length === 0) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // Same person across every tenant they belong to → store the collected phone
  // on all matched accounts. (Applied before the workspace picker so it lands
  // even when the user owns multiple workspaces.)
  if (phoneToStore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("users")
      .update({ phone: phoneToStore })
      .in("id", matched.map((u) => u.id))
  }

  // Pull the tenants for the matched accounts (active only).
  const tenantIds = [...new Set(matched.map((u) => u.tenant_id))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenants } = await (supabase as any)
    .from("tenants")
    .select("id, slug, name, primary_color, industry, onboarding_complete, status")
    .in("id", tenantIds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantById = new Map<string, any>((tenants ?? []).map((t: any) => [t.id, t]))

  const workspaces = matched
    .map((u) => ({ user: u, tenant: tenantById.get(u.tenant_id) }))
    .filter((w) => w.tenant && w.tenant.status === "active")

  if (workspaces.length === 0) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // Belongs to multiple workspaces → let the user pick (the page re-verifies
  // via /api/auth/select-workspace).
  if (workspaces.length > 1) {
    return NextResponse.json({
      choose: true,
      workspaces: workspaces.map(({ user, tenant }) => ({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
        name: tenant.name,
        slug: tenant.slug,
        primary_color: tenant.primary_color,
        industry: tenant.industry,
      })),
    })
  }

  const { user, tenant } = workspaces[0]
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "admin" | "client" | "employee",
    tenant_id: tenant.id,
  })
  return NextResponse.json({
    role: user.role,
    onboarding_complete: tenant.onboarding_complete ?? false,
    slug: tenant.slug,
  })
}
