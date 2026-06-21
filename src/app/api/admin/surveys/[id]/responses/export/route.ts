import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const supabase = createClient()

  const [{ data: survey }, { data: questions }, { data: submissions }] = await Promise.all([
    (supabase as any).from("surveys").select("title, slug").eq("id", id).single(),
    (supabase as any).from("survey_questions").select("*").eq("survey_id", id).order("sort_order"),
    (supabase as any).from("survey_submissions").select("*, survey_answers(*)").eq("survey_id", id).order("submitted_at"),
  ])

  const cols = ["#", "Submitted At", "Email", ...(questions ?? []).map((q: any) => q.label)]
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`

  const rows = (submissions ?? []).map((sub: any, i: number) => {
    const answerMap: Record<string, string> = {}
    for (const a of (sub.survey_answers ?? [])) {
      if (a.values?.length) answerMap[a.question_id] = a.values.join(", ")
      else if (a.value) answerMap[a.question_id] = a.value
    }
    const cells = [
      String(i + 1),
      new Date(sub.submitted_at).toLocaleString("en-AU"),
      sub.respondent_email ?? "",
      ...(questions ?? []).map((q: any) => answerMap[q.id] ?? ""),
    ]
    return cells.map(escape).join(",")
  })

  const csv = [cols.map(escape).join(","), ...rows].join("\n")
  const filename = `survey-${survey?.slug ?? id}-responses.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
