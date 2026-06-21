import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { SurveyBuilder } from "./builder"

export default async function AdminSurveyBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") redirect("/admin/login")

  const { id } = await params
  const supabase = createClient()

  const [{ data: survey }, { data: sections }, { data: projects }] = await Promise.all([
    (supabase as any).from("surveys").select("*").eq("id", id).single(),
    (supabase as any).from("survey_sections").select("*, survey_questions(*)").eq("survey_id", id).order("sort_order"),
    (supabase as any).from("projects").select("id, title").order("title"),
  ])

  if (!survey) notFound()

  const normalisedSections = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.survey_questions ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
    survey_questions: undefined,
  }))

  return <SurveyBuilder survey={survey} sections={normalisedSections} projects={projects ?? []} />
}
