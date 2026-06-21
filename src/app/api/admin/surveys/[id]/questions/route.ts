import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const supabase = createClient()

  const { data: last } = await (supabase as any)
    .from("survey_questions")
    .select("sort_order")
    .eq("survey_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? -1) + 1

  const { data, error } = await (supabase as any)
    .from("survey_questions")
    .insert({
      survey_id: id,
      section_id: body.section_id ?? null,
      type: body.type ?? "short_text",
      label: body.label ?? "Untitled question",
      description: body.description ?? null,
      required: body.required ?? false,
      options: body.options ?? null,
      config: body.config ?? null,
      sort_order,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}
