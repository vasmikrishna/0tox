import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { slugify, validateSlug } from "@/lib/onboarding"

/**
 * POST /api/onboarding/create
 * Claims a subdomain and creates the owner account in one step:
 *   1. validate + re-check the slug is free (guards against races)
 *   2. create the tenant (onboarding_complete = false → portal stays locked)
 *   3. create the owner user, scoped to that tenant
 *   4. start a session so they can continue into the /build flow
 *
 * The account is bound to the new tenant, so it only works on that subdomain.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const businessName = String(body.businessName ?? "").trim()
  const slug = slugify(String(body.slug ?? ""))
  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")

  if (!businessName) return NextResponse.json({ error: "Business name is required" }, { status: 400 })
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

  const format = validateSlug(slug)
  if (!format.valid) return NextResponse.json({ error: `Subdomain: ${format.reason}` }, { status: 400 })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") || !(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const supabase = createClient()

  // Re-check availability just before insert.
  const { data: taken } = await (supabase as any).from("tenants").select("id").eq("slug", slug).maybeSingle()
  if (taken) return NextResponse.json({ error: "That subdomain was just taken — try another" }, { status: 409 })

  // Create the tenant.
  const { data: tenant, error: tErr } = await (supabase as any)
    .from("tenants")
    .insert({
      name: businessName,
      slug,
      industry: "general",
      plan: "starter",
      status: "active",
      onboarding_complete: false,
      contact_email: email,
      settings: { business: { name: businessName } },
    })
    .select("id")
    .single()

  if (tErr || !tenant) {
    // 23505 = unique violation on slug (race we lost).
    const conflict = tErr?.code === "23505"
    return NextResponse.json(
      { error: conflict ? "That subdomain was just taken — try another" : "Could not create your site" },
      { status: conflict ? 409 : 500 },
    )
  }

  // Create the owner user, scoped to the new tenant. The person who claims a
  // subdomain owns that tenant, so they get the "admin" role (full portal),
  // not "client". (Platform super-admin is separate — see auth/login.)
  try {
    const bcrypt = await import("bcryptjs")
    const password_hash = await bcrypt.hash(password, 12)
    const { data: user, error: uErr } = await (supabase as any)
      .from("users")
      .insert({ name, email, password_hash, role: "admin", tenant_id: tenant.id, status: "active" })
      .select("id, email, name, role, tenant_id")
      .single()

    if (uErr || !user) {
      // Roll back the orphaned tenant so the slug frees up again.
      await (supabase as any).from("tenants").delete().eq("id", tenant.id)
      return NextResponse.json({ error: "Could not create your account" }, { status: 500 })
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: "admin", tenant_id: tenant.id })
    return NextResponse.json({ ok: true, slug, tenantId: tenant.id })
  } catch {
    await (supabase as any).from("tenants").delete().eq("id", tenant.id)
    return NextResponse.json({ error: "Could not create your account" }, { status: 500 })
  }
}
