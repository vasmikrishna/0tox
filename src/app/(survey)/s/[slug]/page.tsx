import { createClient } from "@/lib/supabase/server"
import type { Survey, SurveySection, SurveyQuestion } from "@/types"
import { SurveyForm } from "./survey-form"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SurveyPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data: survey } = await (supabase as any)
    .from("surveys")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single() as { data: Survey | null }

  if (!survey) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center">
        <p className="text-muted-foreground text-base">
          This survey is not accepting responses.
        </p>
      </div>
    )
  }

  const { data: rawSections } = await (supabase as any)
    .from("survey_sections")
    .select("*, survey_questions(*)")
    .eq("survey_id", survey.id)
    .order("sort_order") as { data: (SurveySection & { survey_questions: SurveyQuestion[] })[] | null }

  const sections: SurveySection[] = (rawSections ?? []).map((section) => ({
    ...section,
    questions: [...(section.survey_questions ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }))

  return <SurveyForm survey={survey} sections={sections} />
}
