import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import type { BlogPostStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATUSES: BlogPostStatus[] = ["draft", "published"]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET — fetch a single blog post (admin only)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase.from("blog_posts").select("*").eq("id", id)
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query.single()
  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}

// PATCH — partial update of a blog post (admin only)
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
  if (typeof body.excerpt === "string") update.excerpt = body.excerpt
  if (typeof body.content_html === "string") update.content_html = body.content_html
  if (body.content_json !== undefined) update.content_json = body.content_json
  if (typeof body.cover_image_url === "string") update.cover_image_url = body.cover_image_url
  if (typeof body.author_name === "string") update.author_name = body.author_name
  if (Array.isArray(body.tags)) update.tags = body.tags
  if (typeof body.meta_title === "string") update.meta_title = body.meta_title
  if (typeof body.meta_description === "string") update.meta_description = body.meta_description
  if (typeof body.og_image_url === "string") update.og_image_url = body.og_image_url
  if (typeof body.canonical_url === "string") update.canonical_url = body.canonical_url
  if (typeof body.noindex === "boolean") update.noindex = body.noindex
  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status as BlogPostStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    update.status = body.status
    // If transitioning to published and published_at is not set, set it to now
    if (body.status === "published" && !body.published_at) {
      update.published_at = new Date().toISOString()
    }
  }
  if (typeof body.published_at === "string") update.published_at = body.published_at

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({
      post: { id, ...update, updated_at: new Date().toISOString() },
    })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase.from("blog_posts").update(update as never).eq("id", id)
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query.select().single()
  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}

// DELETE — remove a blog post (admin only)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase.from("blog_posts").delete().eq("id", id)
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
