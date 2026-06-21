import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"

// POST — create one stage (single body) or many (body.stages[]) for a project (admin only)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId } = await params
  const supabase = createClient()
  const body = await request.json()

  // Bulk insert (template application)
  if (Array.isArray(body.stages)) {
    const rows = body.stages
      .map((s: { name?: string; description?: string | null; sort_order?: number }, index: number) => ({
        project_id: projectId,
        name: typeof s.name === "string" ? s.name.trim() : "",
        description: s.description ? String(s.description).trim() || null : null,
        sort_order: typeof s.sort_order === "number" ? s.sort_order : index + 1,
        visible_to_client: true,
        status: "pending" as const,
      }))
      .filter((s: { name: string }) => s.name)

    if (!rows.length) return NextResponse.json({ error: "No valid stages" }, { status: 400 })

    const { data, error } = await supabase
      .from("stages")
      .insert(rows)
      .select("*, deliverable_files(*)")
      .order("sort_order")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ stages: data ?? [] })
  }

  // Single insert
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("stages")
    .insert({
      project_id: projectId,
      name,
      description: typeof body.description === "string" ? body.description : null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 1,
      visible_to_client: true,
      status: "pending",
    })
    .select("*, deliverable_files(*)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action: "stage.created",
    entityType: "stage",
    entityId: data.id,
    changes: { name: { old: null, new: name } },
  })

  return NextResponse.json({ stage: data })
}
