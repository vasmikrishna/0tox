import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"

async function assertSuperAdmin() {
  const session = await getSession()
  if (!session || session.email !== SUPER_ADMIN_EMAIL) return null
  return session
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  const [{ data: tenant }, { data: users }] = await Promise.all([
    (supabase as any).from("tenants").select("*").eq("id", id).single(),
    (supabase as any).from("users").select("id, name, email, role, created_at").eq("tenant_id", id).order("created_at"),
  ])

  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ tenant, users: users ?? [] })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const supabase = createClient()

  const allowed = ["name", "slug", "plan", "status", "contact_email", "primary_color", "logo_url", "settings"]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await (supabase as any)
    .from("tenants").update(updates).eq("id", id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenant: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const supabase = createClient()

  // CASCADE deletes users, projects, surveys etc. via FK constraints
  const { error } = await (supabase as any).from("tenants").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
