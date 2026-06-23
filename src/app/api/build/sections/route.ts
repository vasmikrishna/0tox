import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("section_templates")
    .select("id, name, section_type, description, html, css, preview_url, tags, sort_order")
    .eq("status", "approved")
    .order("section_type", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sections: data ?? [] })
}
