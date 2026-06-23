import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_REFERENCE_SITES } from "@/lib/default-reference-sites"
import type { ReferenceSite } from "@/types"

interface GalleryRow {
  id: string
  name: string
  description: string | null
  industry: string | null
  style: string | null
  html: string | null
  css: string | null
  preview_url: string | null
  sort_order: number | null
  status: ReferenceSite["status"]
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * GET /api/build/reference-sites
 * Returns every style the user can choose from in the builder's "Choose a style" step:
 *  - the curated `reference_sites` (rendered as live previews), followed by
 *  - the larger `page_templates_gallery` (100+ themed templates, shown as preview images).
 * Both are returned in the shared ReferenceSite shape so the wizard can treat them uniformly.
 */
export async function GET() {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
    const db = supabase as any

    const [refsRes, galleryRes] = await Promise.all([
      db
        .from("reference_sites")
        .select("id, name, description, industry, html, css, thumbnail_url, sort_order, status, created_by, created_at, updated_at")
        .eq("status", "approved")
        .order("sort_order", { ascending: true }),
      db
        .from("page_templates_gallery")
        .select("id, name, description, industry, style, html, css, preview_url, sort_order, status, created_by, created_at, updated_at")
        .eq("status", "approved")
        .order("industry", { ascending: true })
        .order("sort_order", { ascending: true }),
    ])

    const dbRefs = (refsRes.data ?? []) as ReferenceSite[]
    const curated: ReferenceSite[] = (dbRefs.length > 0 ? dbRefs : DEFAULT_REFERENCE_SITES).map((s) => ({
      ...s,
      source: "reference" as const,
    }))

    const gallery: ReferenceSite[] = ((galleryRes.data ?? []) as GalleryRow[]).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      industry: t.industry ?? "general",
      html: t.html ?? "",
      css: t.css ?? "",
      thumbnail_url: t.preview_url ?? null,
      sort_order: t.sort_order ?? 0,
      status: t.status,
      created_by: t.created_by ?? null,
      created_at: t.created_at,
      updated_at: t.updated_at,
      source: "gallery" as const,
      style: t.style ?? undefined,
    }))

    return NextResponse.json({ sites: [...curated, ...gallery] })
  } catch {
    return NextResponse.json({
      sites: DEFAULT_REFERENCE_SITES.map((s) => ({ ...s, source: "reference" as const })),
    })
  }
}
