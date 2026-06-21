import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import type { StageTemplate } from "@/types"

// GET — stage templates for a tier (admin config view)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tier = request.nextUrl.searchParams.get("tier")
  if (!tier?.trim()) return NextResponse.json({ error: "Invalid tier" }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from("stage_templates")
    .select("*")
    .eq("service_tier", tier)
    .order("sort_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: (data ?? []) as StageTemplate[] })
}

// POST — create one template (single body) or many (body.templates[]) (admin only)
export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = createClient()
  const body = await request.json()

  if (Array.isArray(body.templates)) {
    const rows = body.templates
      .map((t: { service_tier?: string; name?: string; description?: string | null; sort_order?: number }, index: number) => ({
        service_tier: t.service_tier ?? body.service_tier,
        name: typeof t.name === "string" ? t.name.trim() : "",
        description: t.description ? String(t.description).trim() || null : null,
        sort_order: typeof t.sort_order === "number" ? t.sort_order : index + 1,
      }))
      .filter((t: { name: string }) => t.name)

    if (!rows.length) return NextResponse.json({ error: "No valid templates" }, { status: 400 })

    const { data, error } = await supabase
      .from("stage_templates")
      .insert(rows)
      .select()
      .order("sort_order")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ templates: data ?? [] })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("stage_templates")
    .insert({
      service_tier: body.service_tier,
      name,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
