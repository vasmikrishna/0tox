import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient()

  const { data: survey } = await (supabase as any)
    .from("surveys")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()

  if (!survey) return NextResponse.json({ error: "Survey not found or not active" }, { status: 404 })

  const session = await getSession()
  if (!survey.allow_anonymous && !session) {
    return NextResponse.json({ error: "Login required to submit this survey" }, { status: 401 })
  }

  const body = await req.json()
  const answers: Record<string, string | string[]> = body.answers ?? {}
  const respondentEmail: string | undefined = body.email ?? session?.email

  // one_response check — use maybeSingle() so missing row doesn't throw
  if (survey.one_response && (session?.id || respondentEmail)) {
    let dupQuery = (supabase as any)
      .from("survey_submissions")
      .select("id")
      .eq("survey_id", survey.id)

    if (session?.id && session.id !== "admin") {
      dupQuery = dupQuery.eq("respondent_id", session.id)
    } else if (respondentEmail) {
      dupQuery = dupQuery.eq("respondent_email", respondentEmail)
    }

    const { data: existing } = await dupQuery.maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "You have already responded to this survey" }, { status: 409 })
    }
  }

  const { data: questions } = await (supabase as any)
    .from("survey_questions")
    .select("id, type, required, label")
    .eq("survey_id", survey.id)

  for (const q of (questions ?? [])) {
    if (!q.required) continue
    const val = answers[q.id]
    const isEmpty = !val || (Array.isArray(val) && val.length === 0) || val === ""
    if (isEmpty) return NextResponse.json({ error: `"${q.label}" is required` }, { status: 400 })
  }

  const respondentId = session?.id && session.id !== "admin" ? session.id : null

  const { data: submission, error: subErr } = await (supabase as any)
    .from("survey_submissions")
    .insert({
      survey_id: survey.id,
      respondent_id: respondentId,
      respondent_email: survey.collect_email ? (respondentEmail ?? null) : null,
    })
    .select()
    .single()

  if (subErr || !submission) {
    console.error("Submit error:", subErr)
    return NextResponse.json({ error: subErr?.message ?? "Failed to submit" }, { status: 500 })
  }

  const answerRows = Object.entries(answers).map(([question_id, val]) => ({
    submission_id: submission.id,
    question_id,
    value: Array.isArray(val) ? null : String(val),
    values: Array.isArray(val) ? val : null,
    file_urls: null,
  }))

  if (answerRows.length) {
    const { error: ansErr } = await (supabase as any).from("survey_answers").insert(answerRows)
    if (ansErr) console.error("Answer insert error:", ansErr)
  }

  return NextResponse.json({ ok: true, submission_id: submission.id })
}
