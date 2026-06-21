import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId, employeeId } = await params
  const supabase = createClient()

  const { data: employee } = await (supabase as any)
    .from("users")
    .select("name, email")
    .eq("id", employeeId)
    .single()

  const { error } = await (supabase as any)
    .from("project_assignments")
    .delete()
    .eq("project_id", projectId)
    .eq("employee_id", employeeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (employee) {
    await logChange({
      projectId,
      userId: session.id,
      userEmail: session.email,
      action: "assignment.removed",
      entityType: "assignment",
      changes: { employee: { old: `${employee.name} (${employee.email})`, new: null } },
    })
  }

  return NextResponse.json({ ok: true })
}
