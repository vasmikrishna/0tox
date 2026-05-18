import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_INTAKE_QUESTIONS } from "@/lib/intake-defaults"
import { DEFAULT_SERVICE_TIERS } from "@/lib/stage-template-defaults"
import type { DefaultServiceTier, IntakeQuestion, ServiceTier } from "@/types"

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier") as ServiceTier | null
  if (!tier?.trim()) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  const supabase = createClient()
  const query = () => supabase
    .from("intake_questions")
    .select("*")
    .eq("service_tier", tier)
    .eq("active", true)
    .order("sort_order")

  const { data, error } = await query()
  if (!error && data?.length) {
    return NextResponse.json({ questions: data })
  }

  if (!DEFAULT_SERVICE_TIERS.includes(tier as DefaultServiceTier)) {
    return NextResponse.json({ questions: [] })
  }

  const defaults = DEFAULT_INTAKE_QUESTIONS[tier as DefaultServiceTier].map(question => ({
    ...question,
    active: true,
  }))

  const { data: seeded } = await supabase
    .from("intake_questions")
    .insert(defaults)
    .select()

  if (seeded?.length) {
    return NextResponse.json({ questions: seeded })
  }

  return NextResponse.json({
    questions: defaults.map((question, index) => ({
      ...question,
      id: `${tier}-default-${index + 1}`,
    })) satisfies IntakeQuestion[],
  })
}
