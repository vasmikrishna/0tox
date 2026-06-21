import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { composeProjectNotes, normalizeProjectAssets } from "@/lib/project-assets"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"

function isValidUUID(val?: string) {
  if (!val) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(val)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const tenantId = session.tenant_id

  const { id } = await params
  const supabase = createClient()

  // 1. Authorize: Admin or assigned Employee
  let isAuthorized = false
  if (session.role === "admin") {
    isAuthorized = true
  } else if (session.role === "employee") {
    const { data: assignment } = await supabase
      .from("project_assignments")
      .select("id")
      .eq("project_id", id)
      .eq("employee_id", session.id)
      .single()
    if (assignment) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const projectLinks = Array.isArray(body.project_links)
    ? normalizeProjectAssets(body.project_links)
    : []

  const { data: project } = await supabase
    .from("projects")
    .select("admin_notes")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // 2. Fetch all project stages to perform synchronization
  const { data: stages } = await supabase
    .from("stages")
    .select("id, name, visible_to_client")
    .eq("project_id", id)

  const stageIds = new Set((stages ?? []).map(s => s.id))

  // Synchronize stage folders changes (name, visibility) back to stages table
  for (const stage of (stages ?? [])) {
    const folderAsset = projectLinks.find(a => a.id === stage.id && a.kind === "folder")
    if (folderAsset) {
      const updates: { name?: string; visible_to_client?: boolean } = {}
      if (folderAsset.label && folderAsset.label !== stage.name) {
        updates.name = folderAsset.label
      }
      if (folderAsset.visible_to_client !== undefined && folderAsset.visible_to_client !== stage.visible_to_client) {
        updates.visible_to_client = folderAsset.visible_to_client
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("stages").update(updates).eq("id", stage.id)
      }
    }
  }

  // Sync stage deliverables (files in stage folders)
  const incomingDeliverables = projectLinks.filter(asset =>
    asset.kind === "file" && asset.folder_id && stageIds.has(asset.folder_id)
  )

  const { data: existingDeliverables } = await supabase
    .from("deliverable_files")
    .select("*")
    .in("stage_id", Array.from(stageIds))

  const existingUrls = new Set((existingDeliverables ?? []).map(d => d.url))
  const incomingUrls = new Set(incomingDeliverables.map(d => d.url).filter(Boolean))

  // Delete removed deliverables
  const toDelete = (existingDeliverables ?? []).filter(d => !incomingUrls.has(d.url))
  if (toDelete.length > 0) {
    await supabase
      .from("deliverable_files")
      .delete()
      .in("id", toDelete.map(d => d.id))
  }

  // Insert new deliverables
  const toInsert = incomingDeliverables.filter(d => d.url && !existingUrls.has(d.url))
  if (toInsert.length > 0) {
    const insertRows = toInsert.map(d => ({
      ...(isValidUUID(d.id) ? { id: d.id } : {}),
      stage_id: d.folder_id!,
      name: d.label,
      url: d.url,
      size: d.size || 0,
      uploaded_at: d.created_at || new Date().toISOString()
    }))
    await supabase.from("deliverable_files").insert(insertRows)
  }

  // 3. Strip stage folders and stage deliverables from projectLinks before saving
  const strippedLinks = projectLinks.filter(asset => {
    const isStageFolder = asset.id && stageIds.has(asset.id)
    const hasStageId = asset.stage_id && stageIds.has(asset.stage_id)
    const isInsideStage = asset.folder_id && stageIds.has(asset.folder_id)
    return !isStageFolder && !hasStageId && !isInsideStage
  })

  const { data, error } = await supabase
    .from("projects")
    .update({
      admin_notes: composeProjectNotes(project.admin_notes as string | null, strippedLinks),
      project_links: strippedLinks
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logChange({
    projectId: id,
    userId: session.id,
    userEmail: session.email,
    action: "project.updated",
    entityType: "project",
    entityId: id,
  })

  return NextResponse.json({ project: data })
}

