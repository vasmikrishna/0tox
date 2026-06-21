import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { ResponsesView } from "./responses-view"

export default async function SurveyResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") redirect("/admin/login")

  const { id } = await params
  const supabase = createClient()

  const { data: survey } = await (supabase as any).from("surveys").select("*").eq("id", id).single()
  if (!survey) notFound()

  const { data: questions } = await (supabase as any)
    .from("survey_questions")
    .select("*")
    .eq("survey_id", id)
    .order("sort_order")

  return <ResponsesView survey={survey} questions={questions ?? []} surveyId={id} />
}
