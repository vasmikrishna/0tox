import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"

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

// GET — list blog posts (admin only)
export async function GET() {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ posts: [] })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false })
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts: data ?? [] })
}

// POST — create a blog post (admin only)
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

  const excerpt = typeof body.excerpt === "string" ? body.excerpt : ""
  const content_html = typeof body.content_html === "string" ? body.content_html : ""
  const content_json = body.content_json ?? null
  const cover_image_url = typeof body.cover_image_url === "string" ? body.cover_image_url : null
  const author_name = typeof body.author_name === "string" ? body.author_name : null
  const tags = Array.isArray(body.tags) ? body.tags : []
  const meta_title = typeof body.meta_title === "string" ? body.meta_title : null
  const meta_description = typeof body.meta_description === "string" ? body.meta_description : null
  const og_image_url = typeof body.og_image_url === "string" ? body.og_image_url : null
  const canonical_url = typeof body.canonical_url === "string" ? body.canonical_url : null
  const noindex = typeof body.noindex === "boolean" ? body.noindex : false
  const status = body.status === "published" ? "published" : "draft"

  const published_at = status === "published" ? new Date().toISOString() : null

  const record = {
    title,
    slug,
    excerpt,
    content_html,
    content_json,
    cover_image_url,
    author_name,
    tags,
    status,
    meta_title,
    meta_description,
    og_image_url,
    canonical_url,
    noindex,
    published_at,
  }

  if (!supabaseConfigured()) {
    const now = new Date().toISOString()
    return NextResponse.json({
      post: {
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
    .from("blog_posts")
    .insert({ ...record, tenant_id: tenant?.id ?? null } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: data })
}
