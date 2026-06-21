import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Plus, ClipboardList, MessageSquare, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { CopyLinkButton } from "./copy-link-button"

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Draft", variant: "default" },
  active: { label: "Active", variant: "success" },
  closed: { label: "Closed", variant: "warning" },
}

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
        <div className="space-y-2">
          {surveys.map((survey: any) => {
            const status = statusConfig[survey.status] ?? statusConfig.draft
            return (
              <Card key={survey.id} className="hover:border-foreground/20 transition-colors" data-testid={`survey-card-${survey.id}`}>
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{survey.title}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">/s/{survey.slug}</span>
                      <span>{survey.question_count} question{survey.question_count !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{survey.submission_count} response{survey.submission_count !== 1 ? "s" : ""}</span>
                      <span>Created {formatDate(survey.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {survey.status === "active" && (
                      <CopyLinkButton url={`${origin}/s/${survey.slug}`} surveyId={survey.id} />
                    )}
                    {survey.submission_count > 0 && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/surveys/${survey.id}/responses`}>
                          <Eye className="h-4 w-4" /> Responses
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/surveys/${survey.id}`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
