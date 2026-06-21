import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const tenantId = session.tenant_id

  const { id } = await params
  const supabase = createClient()

  // Fetch employee details
  const { data: employee, error: empError } = await (supabase as any)
    .from("users")
    .select("id, email, name, avatar_url, role, job_title, phone, bio, status, created_at")
    .eq("id", id)
    .eq("role", "employee")
    .eq("tenant_id", tenantId)
    .single()

  if (empError || !employee) {
    return NextResponse.json({ error: empError?.message ?? "Employee not found" }, { status: 404 })
  }

  // Fetch active project assignments
  const { data: assignments } = await (supabase as any)
    .from("project_assignments")
    .select("*, projects(id, title, status)")
    .eq("employee_id", id)

  return NextResponse.json({
    employee,
    assignments: assignments ?? [],
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const tenantId = session.tenant_id

  const { id } = await params
  const body = await req.json()

  const name = typeof body.name === "string" ? body.name.trim() : undefined
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined
  const jobTitle = typeof body.job_title === "string" ? body.job_title.trim() : undefined
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined
  const bio = typeof body.bio === "string" ? body.bio.trim() : undefined
  const status = typeof body.status === "string" ? body.status.trim() : undefined

  // Ensure email is unique if updated
  const supabase = createClient()
  if (email) {
    const { data: existing } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("tenant_id", tenantId)
      .neq("id", id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }
  }

  const updates: Record<string, any> = {}
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email
  if (jobTitle !== undefined) updates.job_title = jobTitle
  if (phone !== undefined) updates.phone = phone
  if (bio !== undefined) updates.bio = bio
  if (status !== undefined && ["active", "inactive"].includes(status)) updates.status = status

  const { data: employee, error } = await (supabase as any)
    .from("users")
    .update(updates)
    .eq("id", id)
    .eq("role", "employee")
    .eq("tenant_id", tenantId)
    .select("id, email, name, avatar_url, role, job_title, phone, bio, status, created_at")
    .single()

  if (error || !employee) {
    return NextResponse.json({ error: error?.message ?? "Failed to update employee" }, { status: 500 })
  }

  return NextResponse.json({ employee })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const tenantId = session.tenant_id

  const { id } = await params
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from("users")
    .delete()
    .eq("id", id)
    .eq("role", "employee")
    .eq("tenant_id", tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
