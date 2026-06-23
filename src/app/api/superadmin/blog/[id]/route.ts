import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import type { BlogPostStatus } from "@/types"

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"

async function assertSuperAdmin() {
  const session = await getSession()
  if (!session || session.email !== SUPER_ADMIN_EMAIL) return null
  return session
}

const STATUSES: BlogPostStatus[] = ["draft", "published"]

// PATCH — update blog post (superadmin only; allow status/noindex/etc)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await assertSuperAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}

  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status as BlogPostStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    update.status = body.status
  }
  if (typeof body.noindex === "boolean") update.noindex = body.noindex

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}

// DELETE — remove a blog post (superadmin only; any tenant's post)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await assertSuperAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const supabase = createClient()
  const { error } = await (supabase as any)
    .from("blog_posts")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
