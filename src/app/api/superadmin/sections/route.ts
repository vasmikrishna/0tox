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
  const { data, error } = await (supabase as any)
    .from("section_templates")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sections: data ?? [] })
}

export async function POST(req: Request) {
  const session = await assertSuperAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, section_type, description, html, css, preview_url, tags, sort_order, status } = body

  if (!name || !section_type || !html) {
    return NextResponse.json({ error: "name, section_type, and html are required" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("section_templates")
    .insert({
      name,
      section_type,
      description: description ?? "",
      html,
      css: css ?? "",
      preview_url: preview_url ?? null,
      tags: tags ?? [],
      sort_order: sort_order ?? 0,
      status: status ?? "draft",
      created_by: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data }, { status: 201 })
}
