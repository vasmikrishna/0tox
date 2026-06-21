import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { questionId } = await params
  const body = await req.json()
  const supabase = createClient()

  const allowed = ["label", "description", "type", "required", "options", "config", "section_id", "sort_order"]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await (supabase as any).from("survey_questions").update(updates).eq("id", questionId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { questionId } = await params
  const supabase = createClient()
  const { error } = await (supabase as any).from("survey_questions").delete().eq("id", questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
