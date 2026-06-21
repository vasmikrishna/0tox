import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import type { IntakeQuestion } from "@/types"

// GET — all questions for a tier, including inactive (admin config view)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tier = request.nextUrl.searchParams.get("tier")
  if (!tier?.trim()) return NextResponse.json({ error: "Invalid tier" }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from("intake_questions")
    .select("*")
    .eq("service_tier", tier)
    .order("sort_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: (data ?? []) as IntakeQuestion[] })
}

// POST — create a question (admin only)
export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = createClient()
  const body = await request.json()

  const label = typeof body.label === "string" ? body.label.trim() : ""
  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("intake_questions")
    .insert({
      service_tier: body.service_tier,
      label,
      type: body.type ?? "text",
      options: Array.isArray(body.options) ? body.options : null,
      required: body.required ?? true,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 1,
      active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}
