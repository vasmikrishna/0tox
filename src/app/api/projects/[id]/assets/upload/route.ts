import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { uploadToR2 } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be 50MB or smaller" }, { status: 413 })
  }

  const { data: project } = await supabase.from("projects").select("id").eq("id", id).single()
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  try {
    const uploaded = await uploadToR2(file, `projects/${id}/assets`)
    return NextResponse.json({ file: { ...uploaded, type: file.type || "application/octet-stream" } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
