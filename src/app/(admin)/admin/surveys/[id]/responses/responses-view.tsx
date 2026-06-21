"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowLeft, Download, Star, ChevronDown, ChevronUp } from "lucide-react"
import type { Survey, SurveyQuestion } from "@/types"

// ─── Bar chart (no dependency) ────────────────────────────────────────────────

function BarChart({ options, counts, total }: { options: string[]; counts: Record<string, number>; total: number }) {
  if (!total) return <p className="text-sm text-muted-foreground">No responses yet</p>
  return (
    <div className="space-y-2">
      {options.map(opt => {
        const count = counts[opt] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={opt} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate mr-2">{opt}</span>
              <span className="text-muted-foreground shrink-0">{count} ({pct}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stats card per question ──────────────────────────────────────────────────

function QuestionStats({ stat }: { stat: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
        <p className="text-xs text-muted-foreground">{stat.total} response{stat.total !== 1 ? "s" : ""}</p>
      </CardHeader>
      <CardContent>
        {(stat.type === "single_choice" || stat.type === "multiple_choice" || stat.type === "dropdown") && (
          <BarChart options={stat.options} counts={stat.counts} total={stat.total} />
        )}
        {stat.type === "rating" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{stat.avg}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn("h-5 w-5", n <= Math.round(stat.avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </div>
            <BarChart
              options={["1", "2", "3", "4", "5"]}
              counts={stat.distribution}
              total={stat.total}
            />
          </div>
        )}
        {stat.type === "number" && stat.total > 0 && (
          <div className="flex gap-6 text-sm">
            <div><p className="text-xs text-muted-foreground">Average</p><p className="font-semibold">{stat.avg}</p></div>
            <div><p className="text-xs text-muted-foreground">Min</p><p className="font-semibold">{stat.min}</p></div>
            <div><p className="text-xs text-muted-foreground">Max</p><p className="font-semibold">{stat.max}</p></div>
          </div>
        )}
        {!["single_choice", "multiple_choice", "dropdown", "rating", "number"].includes(stat.type) && (
          <div className="space-y-1">
            {stat.total === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet</p>
            ) : (
              stat.recent?.map((v: string, i: number) => (
                <p key={i} className="text-sm truncate text-muted-foreground border-l-2 border-border pl-2">{v}</p>
              ))
            )}
            {stat.total > 5 && <p className="text-xs text-muted-foreground">+ {stat.total - 5} more</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Individual submission row ────────────────────────────────────────────────

function SubmissionRow({ sub, questions, index }: { sub: any; questions: SurveyQuestion[]; index: number }) {
  const [open, setOpen] = useState(false)
  const answerMap: Record<string, string> = {}
  for (const a of (sub.survey_answers ?? [])) {
    answerMap[a.question_id] = a.values?.length ? a.values.join(", ") : a.value ?? ""
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-muted-foreground">#{index + 1}</span>
        <span>{new Date(sub.submitted_at).toLocaleString()}</span>
        {sub.respondent_email ? <span className="text-muted-foreground">{sub.respondent_email}</span> : <span className="text-muted-foreground/40 italic">Anonymous</span>}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t divide-y">
          {questions.map(q => (
            <div key={q.id} className="px-4 py-2">
              <p className="text-xs text-muted-foreground">{q.label}</p>
              <p className="text-sm mt-0.5">{answerMap[q.id] ?? <span className="italic text-muted-foreground/60">—</span>}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "summary" | "individual" | "export"

interface Props {
  survey: Survey
  questions: SurveyQuestion[]
  surveyId: string
}

export function ResponsesView({ survey, questions, surveyId }: Props) {
  const [tab, setTab] = useState<Tab>("summary")
  const [stats, setStats] = useState<{ totalSubmissions: number; stats: Record<string, any>; questions: SurveyQuestion[] } | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/surveys/${surveyId}/responses/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoadingStats(false) })
      .catch(() => setLoadingStats(false))
  }, [surveyId])

  useEffect(() => {
    if (tab !== "individual") return
    setLoadingSubmissions(true)
    fetch(`/api/admin/surveys/${surveyId}/responses`)
      .then(r => r.json())
      .then(d => { setSubmissions(d.submissions ?? []); setLoadingSubmissions(false) })
      .catch(() => setLoadingSubmissions(false))
  }, [tab, surveyId])

  function downloadCSV() {
    window.open(`/api/admin/surveys/${surveyId}/responses/export`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/surveys/${surveyId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{survey.title} — Responses</h1>
          {!loadingStats && stats && (
            <p className="text-muted-foreground mt-0.5">{stats.totalSubmissions} total submission{stats.totalSubmissions !== 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["summary", "individual", "export"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            data-testid={`tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Summary */}
      {tab === "summary" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {loadingStats ? (
            <p className="text-muted-foreground text-sm">Loading stats…</p>
          ) : !stats || stats.totalSubmissions === 0 ? (
            <div className="col-span-2">
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground text-sm">No responses yet</CardContent>
              </Card>
            </div>
          ) : (
            (stats.questions ?? questions).map((q: SurveyQuestion) => (
              stats.stats[q.id] ? <QuestionStats key={q.id} stat={stats.stats[q.id]} /> : null
            ))
          )}
        </div>
      )}

      {/* Individual */}
      {tab === "individual" && (
        <div className="space-y-2">
          {loadingSubmissions ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : submissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">No responses yet</CardContent>
            </Card>
          ) : (
            submissions.map((sub, i) => (
              <SubmissionRow key={sub.id} sub={sub} questions={questions} index={i} />
            ))
          )}
        </div>
      )}

      {/* Export */}
      {tab === "export" && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-4 text-center">
            <Download className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Download all responses as CSV</p>
              <p className="text-sm text-muted-foreground mt-1">One row per submission, one column per question</p>
            </div>
            <Button variant="brand" onClick={downloadCSV} data-testid="download-csv-btn">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
