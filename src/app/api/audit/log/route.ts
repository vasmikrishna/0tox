import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { logChange } from "@/lib/audit"
import { notifyProjectStatusChange } from "@/lib/email"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, action, entityType, entityId, changes } = body

  if (!projectId || !action) {
    return NextResponse.json({ error: "projectId and action required" }, { status: 400 })
  }

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action,
    entityType,
    entityId,
    changes,
  })

  // Trigger emails on project status updates
  if (action === "project.status_changed" && changes?.status) {
    const oldStatus = changes.status.old || "unknown"
    const newStatus = changes.status.new || "unknown"
    void notifyProjectStatusChange(projectId, oldStatus, newStatus)
  }

  return NextResponse.json({ ok: true })
}
