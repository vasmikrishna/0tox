import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

function randomSuffix() { return Math.random().toString(36).slice(2, 6) }

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const supabase = createClient()

  const { data: original } = await (supabase as any).from("surveys").select("*").eq("id", id).single()
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const newSlug = `${original.slug}-${randomSuffix()}`
  const createdBy = session.id === "admin" ? null : session.id
  const { data: newSurvey, error } = await (supabase as any)
    .from("surveys")
    .insert({ ...original, id: undefined, slug: newSlug, title: `${original.title} (copy)`, status: "draft", created_by: createdBy, created_at: undefined, updated_at: undefined })
    .select().single()

  if (error || !newSurvey) return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 })

  const { data: sections } = await (supabase as any).from("survey_sections").select("*, survey_questions(*)").eq("survey_id", id).order("sort_order")

  for (const section of (sections ?? [])) {
    const { data: newSection } = await (supabase as any)
      .from("survey_sections")
      .insert({ survey_id: newSurvey.id, title: section.title, description: section.description, sort_order: section.sort_order })
      .select().single()

    if (newSection && section.survey_questions?.length) {
      await (supabase as any).from("survey_questions").insert(
        section.survey_questions.map((q: any) => ({ ...q, id: undefined, survey_id: newSurvey.id, section_id: newSection.id }))
      )
    }
  }

  return NextResponse.json({ survey: newSurvey })
}
