import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params
  const { name, email, password, role } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password are required" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }
  if (!["admin", "employee", "client"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const supabase = createClient()

  // Check tenant exists
  const { data: tenant } = await (supabase as any).from("tenants").select("id").eq("id", tenantId).single()
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  // Check email not already taken within this tenant
  const { data: existing } = await (supabase as any)
    .from("users").select("id").eq("email", email).eq("tenant_id", tenantId).maybeSingle()
  if (existing) return NextResponse.json({ error: "A user with that email already exists in this tenant" }, { status: 409 })

  const bcrypt = await import("bcryptjs")
  const password_hash = await bcrypt.hash(password, 12)

  const { data: user, error } = await (supabase as any)
    .from("users")
    .insert({ name, email, password_hash, role, tenant_id: tenantId })
    .select("id, name, email, role, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user }, { status: 201 })
}
