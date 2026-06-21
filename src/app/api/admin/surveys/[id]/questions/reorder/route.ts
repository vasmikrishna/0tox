import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await params
  const body = await req.json()
  const ids: string[] = body.ids ?? []
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids array required" }, { status: 400 })

  const supabase = createClient()
  await Promise.all(ids.map((qId, index) =>
    (supabase as any).from("survey_questions").update({ sort_order: index }).eq("id", qId)
  ))

  return NextResponse.json({ ok: true })
}
