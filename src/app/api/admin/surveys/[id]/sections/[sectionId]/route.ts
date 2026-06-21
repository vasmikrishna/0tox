import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { sectionId } = await params
  const body = await req.json()
  const supabase = createClient()

  const updates: Record<string, unknown> = {}
  if ("title" in body) updates.title = body.title
  if ("description" in body) updates.description = body.description

  const { data, error } = await (supabase as any).from("survey_sections").update(updates).eq("id", sectionId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { sectionId } = await params
  const supabase = createClient()
  await (supabase as any).from("survey_questions").delete().eq("section_id", sectionId)
  const { error } = await (supabase as any).from("survey_sections").delete().eq("id", sectionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
