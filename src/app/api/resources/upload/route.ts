import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { uploadToR2 } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

const MAX_FILE_SIZE = 50 * 1024 * 1024

type ResourceStage = {
  id: string
  project_id: string
  projects?: { client_id?: string } | { client_id?: string }[]
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const stageId = formData.get("stageId")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  if (typeof stageId !== "string" || !stageId) {
    return NextResponse.json({ error: "Missing stage" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be 50MB or smaller" }, { status: 413 })
  }

  const supabase = createClient()
  const { data: stage } = await supabase
    .from("stages")
    .select("id, project_id, projects(client_id)")
    .eq("id", stageId)
    .single()

  const resourceStage = stage as unknown as ResourceStage | null
  const clientId = Array.isArray(resourceStage?.projects)
    ? resourceStage?.projects[0]?.client_id
    : resourceStage?.projects?.client_id

  let isAuthorized = false
  if (session.role === "admin") {
    isAuthorized = true
  } else if (session.role === "client" && clientId === session.id) {
    isAuthorized = true
  } else if (session.role === "employee" && resourceStage) {
    const { data: assignment } = await supabase
      .from("project_assignments")
      .select("id")
      .eq("project_id", resourceStage.project_id)
      .eq("employee_id", session.id)
      .single()
    if (assignment) {
      isAuthorized = true
    }
  }

  if (!resourceStage || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }


  const uploaded = await uploadToR2(file, `projects/${resourceStage.project_id}/stages/${stageId}`)
  const { data, error } = await supabase
    .from("deliverable_files")
    .insert({
      stage_id: stageId,
      name: uploaded.name,
      url: uploaded.url,
      size: uploaded.size,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ file: data })
}
