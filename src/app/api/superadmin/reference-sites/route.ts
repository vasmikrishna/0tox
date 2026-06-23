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
    .from("reference_sites")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sites: data ?? [] })
}

export async function POST(req: Request) {
  const session = await assertSuperAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, description, industry, html, css, thumbnail_url, sort_order, status } = body

  if (!name || !html) {
    return NextResponse.json({ error: "name and html are required" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("reference_sites")
    .insert({
      name,
      description: description ?? "",
      industry: industry ?? "other",
      html,
      css: css ?? "",
      thumbnail_url: thumbnail_url ?? null,
      sort_order: sort_order ?? 0,
      status: status ?? "draft",
      created_by: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ site: data }, { status: 201 })
}
