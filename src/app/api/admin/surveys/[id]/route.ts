import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const tenantId = session.tenant_id
  const { id } = await params
  const supabase = createClient()

  const { data: survey, error } = await (supabase as any).from("surveys").select("*").eq("id", id).eq("tenant_id", tenantId).single()
  if (error || !survey) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: sections } = await (supabase as any)
    .from("survey_sections")
    .select("*, survey_questions(*)")
    .eq("survey_id", id)
    .order("sort_order")

  const normalised = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.survey_questions ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
    survey_questions: undefined,
  }))

  return NextResponse.json({ survey, sections: normalised })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const tenantId = session.tenant_id
  const { id } = await params
  const body = await req.json()
  const supabase = createClient()

  const allowed = ["title", "description", "status", "project_id", "allow_anonymous", "collect_email", "one_response", "thank_you_message"]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await (supabase as any).from("surveys").update(updates).eq("id", id).eq("tenant_id", tenantId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const tenantId = session.tenant_id
  const { id } = await params
  const supabase = createClient()
  const { error } = await (supabase as any).from("surveys").delete().eq("id", id).eq("tenant_id", tenantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
