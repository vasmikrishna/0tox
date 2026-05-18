import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { composeProjectNotes, normalizeProjectAssets } from "@/lib/project-assets"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const projectLinks = Array.isArray(body.project_links)
    ? normalizeProjectAssets(body.project_links)
    : []

  const supabase = createClient()
  const { data: project } = await supabase
    .from("projects")
    .select("admin_notes")
    .eq("id", id)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      admin_notes: composeProjectNotes(project.admin_notes as string | null, projectLinks),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project: data })
}
