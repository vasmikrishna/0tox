import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_REFERENCE_SITES } from "@/lib/default-reference-sites"

export async function GET() {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  try {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from("reference_sites")
      .select("id, name, description, industry, html, css, thumbnail_url, sort_order, status, created_by, created_at, updated_at")
      .eq("status", "approved")
      .order("sort_order", { ascending: true })

    const dbSites = data ?? []
    const sites = dbSites.length > 0 ? dbSites : DEFAULT_REFERENCE_SITES
    return NextResponse.json({ sites })
  } catch {
    return NextResponse.json({ sites: DEFAULT_REFERENCE_SITES })
  }
}
