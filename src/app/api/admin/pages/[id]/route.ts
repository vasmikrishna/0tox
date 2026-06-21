import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import type { CustomPageStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATUSES: CustomPageStatus[] = ["draft", "published"]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// PATCH — partial update of a custom page (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}

  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim()
  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = slugify(body.slug)
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
    update.slug = slug
  }
  if (typeof body.html === "string") update.html = body.html
  if (typeof body.css === "string") update.css = body.css
  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status as CustomPageStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    update.status = body.status
  }

  const settingHomepage = body.is_homepage === true
  if (typeof body.is_homepage === "boolean") update.is_homepage = body.is_homepage

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({
      page: { id, ...update, updated_at: new Date().toISOString() },
    })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  // Respect the one-homepage rule: clear is_homepage on all other pages first.
  if (settingHomepage) {
    let clear = supabase.from("custom_pages").update({ is_homepage: false } as never)
    if (tenant?.id) clear = clear.eq("tenant_id", tenant.id)
    // Exclude the current page so we don't fight the update below.
    const { error: clearError } = await clear.neq("id", id)
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 })
  }

  let query = supabase.from("custom_pages").update(update as never).eq("id", id)
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ page: data })
}

// DELETE — remove a custom page (admin only)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  if (!supabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase.from("custom_pages").delete().eq("id", id)
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
