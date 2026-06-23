import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"

async function assertSuperAdmin() {
  const session = await getSession()
  if (!session || session.email !== SUPER_ADMIN_EMAIL) return null
  return session
}

export async function GET() {
  if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = createClient()
  const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { order: (c: string, o: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }> } } })
    .from("page_templates_gallery")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(req: Request) {
  const session = await assertSuperAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, slug, description, category, industry, style, html, css, preview_url, tags, sort_order, status, featured } = body

  if (!name || !slug || !html) {
    return NextResponse.json({ error: "name, slug, and html are required" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("page_templates_gallery")
    .insert({
      name,
      slug,
      description: description ?? "",
      category: category ?? "landing",
      industry: industry ?? "general",
      style: style ?? "modern",
      html,
      css: css ?? "",
      preview_url: preview_url ?? null,
      tags: tags ?? [],
      sort_order: sort_order ?? 0,
      status: status ?? "draft",
      featured: featured ?? false,
      created_by: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
