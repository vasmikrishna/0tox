import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6)
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const tenantId = session.tenant_id

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("surveys")
    .select("*, survey_questions(id), survey_submissions(id)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const surveys = (data ?? []).map((s: any) => ({
    ...s,
    question_count: s.survey_questions?.length ?? 0,
    submission_count: s.survey_submissions?.length ?? 0,
    survey_questions: undefined,
    survey_submissions: undefined,
  }))

  return NextResponse.json({ surveys })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const tenantId = session.tenant_id

  const body = await req.json()
  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })

  const supabase = createClient()
  let slug = slugify(title) || "survey"

  const { data: existing } = await (supabase as any).from("surveys").select("id").eq("slug", slug).eq("tenant_id", tenantId).single()
  if (existing) slug = `${slug}-${randomSuffix()}`

  const createdBy = session.id === "admin" ? null : session.id

  const { data: survey, error } = await (supabase as any)
    .from("surveys")
    .insert({ title, description: body.description ?? null, slug, created_by: createdBy, status: "draft", tenant_id: tenantId })
    .select()
    .single()

  if (error || !survey) return NextResponse.json({ error: error?.message ?? "Failed to create survey" }, { status: 500 })

  await (supabase as any).from("survey_sections").insert({ survey_id: survey.id, title: "Section 1", sort_order: 0 })

  return NextResponse.json({ survey })
}
