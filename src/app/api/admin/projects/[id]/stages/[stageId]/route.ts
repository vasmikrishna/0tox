import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { composeProjectNotes, extractProjectAssets } from "@/lib/project-assets"
import { logChange } from "@/lib/audit"

const ALLOWED_FIELDS = ["name", "description", "status", "visible_to_client", "completed_at", "sort_order"] as const

// PATCH — update a stage (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId, stageId } = await params
  const supabase = createClient()
  const body = await request.json()

  const update: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field]
  }
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const { error } = await supabase.from("stages").update(update).eq("id", stageId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action: "stage.updated",
    entityType: "stage",
    entityId: stageId,
  })

  return NextResponse.json({ ok: true })
}

// DELETE — delete a stage, preserving any deliverables as project assets (admin only)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId, stageId } = await params
  const supabase = createClient()

  const { data: stage } = await supabase
    .from("stages")
    .select("*, deliverable_files(*)")
    .eq("id", stageId)
    .single()

  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 })

  const deliverables = (stage.deliverable_files ?? []) as Array<{ id: string; name: string; url: string; size: number | null; uploaded_at: string }>

  // Preserve deliverables by converting them into a regular project asset folder
  if (deliverables.length > 0) {
    const { data: project } = await supabase
      .from("projects")
      .select("admin_notes, project_links")
      .eq("id", projectId)
      .single()

    if (project) {
      const regularAssets = extractProjectAssets(project.admin_notes as string | null)
      const newFolderId = `folder-${Date.now()}`
      const preservedFolder = {
        id: newFolderId,
        label: stage.name,
        url: "",
        type: "folder" as const,
        kind: "folder" as const,
        folder_id: "",
        visible_to_client: stage.visible_to_client,
        created_at: new Date().toISOString(),
      }
      const preservedFiles = deliverables.map(file => ({
        id: file.id,
        label: file.name,
        url: file.url,
        type: "file" as const,
        kind: "file" as const,
        folder_id: newFolderId,
        visible_to_client: stage.visible_to_client,
        size: file.size ?? undefined,
        created_at: file.uploaded_at,
      }))
      const nextAssets = [preservedFolder, ...preservedFiles, ...regularAssets]
      await supabase
        .from("projects")
        .update({
          admin_notes: composeProjectNotes(project.admin_notes as string | null, nextAssets),
          project_links: nextAssets,
        })
        .eq("id", projectId)
    }
  }

  const { error } = await supabase.from("stages").delete().eq("id", stageId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action: "stage.deleted",
    entityType: "stage",
    entityId: stageId,
    changes: { name: { old: stage.name, new: null } },
  })

  return NextResponse.json({ ok: true })
}
