import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { composeProjectNotes, extractProjectAssets } from "@/lib/project-assets"
import { logChange } from "@/lib/audit"
import type { ProjectStatus } from "@/types"

const STATUSES: ProjectStatus[] = ["intake", "review", "active", "completed", "cancelled"]

// PATCH — update project status and/or internal admin notes (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const supabase = createClient()
  const body = await request.json()

  const update: Record<string, unknown> = {}

  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status as ProjectStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    update.status = body.status
    if (body.status === "active") update.started_at = new Date().toISOString()
    if (body.status === "completed") update.completed_at = new Date().toISOString()
  }

  if (typeof body.admin_notes === "string") {
    const { data: existing } = await supabase
      .from("projects")
      .select("admin_notes")
      .eq("id", id)
      .single()
    update.admin_notes = composeProjectNotes(
      body.admin_notes,
      extractProjectAssets((existing?.admin_notes as string | null) ?? null),
    )
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logChange({
    projectId: id,
    userId: session.id,
    userEmail: session.email,
    action: typeof body.status === "string" ? "project.status_changed" : "project.updated",
    entityType: "project",
    entityId: id,
    changes: typeof body.status === "string" ? { status: { old: null, new: body.status } } : undefined,
  })

  return NextResponse.json({ project: data })
}
