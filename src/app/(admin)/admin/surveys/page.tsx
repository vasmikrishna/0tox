import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { SurveysList } from "./surveys-list"

export default async function AdminSurveysPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("surveys")
    .select("*, survey_questions(id), survey_submissions(id)")
    .order("created_at", { ascending: false })

  const surveys = (data ?? []).map((s: any) => ({
    ...s,
    question_count: s.survey_questions?.length ?? 0,
    submission_count: s.survey_submissions?.length ?? 0,
  }))

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Surveys</h1>
          <p className="text-muted-foreground mt-1">{surveys.length} survey{surveys.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/admin/surveys/new">
            <Plus className="h-4 w-4" /> New survey
          </Link>
        </Button>
      </div>

      {surveys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm mb-4">No surveys yet</p>
            <Button asChild variant="brand" size="sm">
              <Link href="/admin/surveys/new"><Plus className="h-4 w-4" /> Create your first survey</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SurveysList surveys={surveys} origin={origin} />
      )}
    </div>
  )
}
