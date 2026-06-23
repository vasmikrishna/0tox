import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import { getTemplate } from "@/lib/page-templates"
import { MOCK_CUSTOM_PAGES } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET — list custom pages (admin only)
export async function GET() {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ pages: MOCK_CUSTOM_PAGES })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase
    .from("custom_pages")
    .select("*")
    .order("updated_at", { ascending: false })
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pages: data ?? [] })
}

// POST — create a custom page (admin only)
export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const slug =
    typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title)
  if (!slug) {
    return NextResponse.json({ error: "A valid slug is required" }, { status: 400 })
  }

  const templateKey = typeof body.template === "string" ? body.template : "blank"
  const customHtml = typeof body.html === "string" ? body.html : ""
  const customCss = typeof body.css === "string" ? body.css : ""

  let html: string
  let css: string
  let tplName: string

  if (customHtml) {
    html = customHtml
    css = customCss
    tplName = templateKey
  } else {
    const template = getTemplate(templateKey)
    html = template.html
    css = template.css
    tplName = template.key
  }

  const record = {
    title,
    slug,
    html,
    css,
    template: tplName,
    status: "draft" as const,
    is_homepage: false,
  }

  if (!supabaseConfigured()) {
    const now = new Date().toISOString()
    return NextResponse.json({
      page: {
        id: `local-${Date.now()}`,
        tenant_id: null,
        ...record,
        created_at: now,
        updated_at: now,
      },
    })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  const { data, error } = await supabase
    .from("custom_pages")
    .insert({ ...record, tenant_id: tenant?.id ?? null } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ page: data })
}
