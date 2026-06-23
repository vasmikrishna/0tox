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
    .from("color_palettes")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ palettes: data ?? [] })
}

export async function POST(req: Request) {
  const session = await assertSuperAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, colors, industry, sort_order, status } = body

  if (!name || !colors) {
    return NextResponse.json({ error: "name and colors are required" }, { status: 400 })
  }

  const required = ["primary", "secondary", "accent", "background", "text", "muted"] as const
  for (const key of required) {
    if (!colors[key]) {
      return NextResponse.json({ error: `colors.${key} is required` }, { status: 400 })
    }
  }

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("color_palettes")
    .insert({
      name,
      colors,
      industry: industry ?? "all",
      sort_order: sort_order ?? 0,
      status: status ?? "draft",
      created_by: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ palette: data }, { status: 201 })
}
