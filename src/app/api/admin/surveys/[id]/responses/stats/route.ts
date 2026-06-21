import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const supabase = createClient()

  const [{ data: questions }, { data: submissions }, { data: answers }] = await Promise.all([
    (supabase as any).from("survey_questions").select("*").eq("survey_id", id).order("sort_order"),
    (supabase as any).from("survey_submissions").select("id").eq("survey_id", id),
    (supabase as any).from("survey_answers")
      .select("*, survey_questions!inner(survey_id)")
      .eq("survey_questions.survey_id", id),
  ])

  const totalSubmissions = submissions?.length ?? 0
  const stats: Record<string, unknown> = {}

  for (const q of (questions ?? [])) {
    const qAnswers = (answers ?? []).filter((a: any) => a.question_id === q.id)

    if (["single_choice", "dropdown"].includes(q.type)) {
      const counts: Record<string, number> = {}
      for (const a of qAnswers) { if (a.value) counts[a.value] = (counts[a.value] ?? 0) + 1 }
      stats[q.id] = { type: q.type, label: q.label, options: q.options ?? [], counts, total: qAnswers.length }
    } else if (q.type === "multiple_choice") {
      const counts: Record<string, number> = {}
      for (const a of qAnswers) { for (const v of (a.values ?? [])) { counts[v] = (counts[v] ?? 0) + 1 } }
      stats[q.id] = { type: q.type, label: q.label, options: q.options ?? [], counts, total: qAnswers.length }
    } else if (q.type === "rating") {
      const nums = qAnswers.map((a: any) => parseFloat(a.value)).filter((n: number) => !isNaN(n))
      const avg = nums.length ? nums.reduce((s: number, n: number) => s + n, 0) / nums.length : 0
      const dist: Record<string, number> = {}
      for (const n of nums) { dist[String(n)] = (dist[String(n)] ?? 0) + 1 }
      stats[q.id] = { type: q.type, label: q.label, avg: Math.round(avg * 10) / 10, distribution: dist, total: nums.length }
    } else if (q.type === "number") {
      const nums = qAnswers.map((a: any) => parseFloat(a.value)).filter((n: number) => !isNaN(n))
      const avg = nums.length ? nums.reduce((s: number, n: number) => s + n, 0) / nums.length : 0
      stats[q.id] = { type: q.type, label: q.label, avg: Math.round(avg * 100) / 100, min: Math.min(...nums), max: Math.max(...nums), total: nums.length }
    } else {
      const recent = qAnswers.slice(0, 5).map((a: any) => a.value).filter(Boolean)
      stats[q.id] = { type: q.type, label: q.label, total: qAnswers.length, recent }
    }
  }

  return NextResponse.json({ totalSubmissions, stats, questions: questions ?? [] })
}
