import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOwnerContext } from "@/lib/build-owner"

export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { templateSlug } = await req.json()
  if (!templateSlug) return NextResponse.json({ error: "templateSlug is required" }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("page_templates_gallery")
    .select("html,css")
    .eq("slug", templateSlug)
    .eq("status", "approved")
    .single()

  if (error || !data) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json({ html: data.html, css: data.css })
}
