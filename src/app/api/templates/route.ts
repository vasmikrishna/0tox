import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const META_COLUMNS = "id,name,slug,description,category,industry,style,preview_url,tags,sort_order,status,featured,created_at,updated_at"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const category = sp.get("category")
  const industry = sp.get("industry")
  const style = sp.get("style")
  const search = sp.get("search")
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "24", 10)))
  const offset = (page - 1) * limit

  const supabase = createClient()
  let query = (supabase as any)
    .from("page_templates_gallery")
    .select(META_COLUMNS, { count: "exact" })
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq("category", category)
  if (industry) query = query.eq("industry", industry)
  if (style) query = query.eq("style", style)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [], total: count ?? 0, page })
}
