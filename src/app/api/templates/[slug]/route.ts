import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("page_templates_gallery")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single()

  if (error || !data) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json({ template: data })
}
