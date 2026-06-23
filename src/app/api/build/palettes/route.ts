import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_PALETTES } from "@/lib/default-palettes"

export async function GET(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const industry = searchParams.get("industry")

  try {
    const supabase = createClient()
    let query = (supabase as any)
      .from("color_palettes")
      .select("id, name, colors, industry, sort_order, status, created_by, created_at, updated_at")
      .eq("status", "approved")
      .order("sort_order", { ascending: true })

    if (industry) {
      query = query.or(`industry.eq.${industry},industry.eq.all`)
    }

    const { data } = await query
    const dbPalettes = data ?? []

    if (dbPalettes.length > 0) {
      return NextResponse.json({ palettes: dbPalettes })
    }
  } catch { /* fall through to defaults */ }

  let palettes = DEFAULT_PALETTES
  if (industry) {
    palettes = DEFAULT_PALETTES.filter((p) => p.industry === industry || p.industry === "all")
  }
  return NextResponse.json({ palettes })
}
