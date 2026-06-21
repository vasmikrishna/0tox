import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient()

  const { data: survey } = await (supabase as any).from("surveys").select("*").eq("slug", slug).eq("status", "active").single()
  if (!survey) return NextResponse.json({ error: "Survey not found or not active" }, { status: 404 })

  const { data: sections } = await (supabase as any)
    .from("survey_sections")
    .select("*, survey_questions(*)")
    .eq("survey_id", survey.id)
    .order("sort_order")

  const normalised = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.survey_questions ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
    survey_questions: undefined,
  }))

  return NextResponse.json({ survey, sections: normalised })
}
