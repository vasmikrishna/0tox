import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import type { ServiceTier } from "@/types"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const serviceTier = body.service_tier as ServiceTier
  const answers = body.answers && typeof body.answers === "object"
    ? body.answers as Record<string, string>
    : {}

  if (!title || !serviceTier?.trim()) {
    return NextResponse.json({ error: "Project title and service tier are required" }, { status: 400 })
  }

  const supabase = createClient()
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", session.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ client_id: user.id, title, service_tier: serviceTier, status: "intake" })
    .select()
    .single()

  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "Failed to create project" }, { status: 500 })
  }

  const questionIds = Object.keys(answers).filter(id => !id.includes("-default-"))
  const responses = questionIds
    .filter(question_id => answers[question_id]?.trim())
    .map(question_id => ({
      project_id: project.id,
      question_id,
      answer: answers[question_id].trim(),
    }))

  if (responses.length) {
    const { error: responseError } = await supabase.from("intake_responses").insert(responses)
    if (responseError) {
      return NextResponse.json({ error: responseError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ project })
}
