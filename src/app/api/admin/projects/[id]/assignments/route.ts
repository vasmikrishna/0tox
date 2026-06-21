import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from("project_assignments")
    .select("*, users!project_assignments_employee_id_fkey(id, name, email)")
    .eq("project_id", id)
    .order("assigned_at")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignments: data ?? [] })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId } = await params
  const body = await req.json()
  const employeeId = typeof body.employee_id === "string" ? body.employee_id : ""

  if (!employeeId) {
    return NextResponse.json({ error: "employee_id is required" }, { status: 400 })
  }

  const supabase = createClient()

  const { data: employee } = await (supabase as any)
    .from("users")
    .select("id, name, email")
    .eq("id", employeeId)
    .eq("role", "employee")
    .single()

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 })
  }

  const assignedBy = session.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.id) ? session.id : null

  const { data, error } = await (supabase as any)
    .from("project_assignments")
    .insert({ project_id: projectId, employee_id: employeeId, assigned_by: assignedBy })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Employee already assigned to this project" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action: "assignment.created",
    entityType: "assignment",
    entityId: data.id,
    changes: { employee: { old: null, new: `${employee.name} (${employee.email})` } },
  })

  return NextResponse.json({ assignment: data })
}
