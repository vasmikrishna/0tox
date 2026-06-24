"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { MessageSquare, Eye } from "lucide-react"
import { CopyLinkButton } from "./copy-link-button"
import { PaginatedList } from "@/components/paginated-list"

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Draft", variant: "default" },
  active: { label: "Active", variant: "success" },
  closed: { label: "Closed", variant: "warning" },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SurveysList({ surveys, origin }: { surveys: any[]; origin: string }) {
  return (
    <PaginatedList
      items={surveys}
      pageSize={10}
      searchPlaceholder="Search surveys by title, slug, or status..."
      testId="surveys"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchText={(s: any) => `${s.title} ${s.slug} ${statusConfig[s.status]?.label ?? s.status}`}
    >
      {(pageSurveys) => (
        <div className="space-y-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {pageSurveys.map((survey: any) => {
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
    </PaginatedList>
  )
}
