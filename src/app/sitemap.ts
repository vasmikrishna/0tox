import type { MetadataRoute } from "next"
import { getTenantSlug, getCurrentTenant } from "@/lib/tenant"
import { getCanonicalOrigin, isMainSite } from "@/lib/seo"
import { FEATURES } from "@/lib/features"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slug = await getTenantSlug()
  const tenant = await getCurrentTenant().catch(() => null)
  const origin = getCanonicalOrigin(tenant, slug)
  const now = new Date()

  if (isMainSite(slug)) {
    return [
      { url: origin, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
      { url: `${origin}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
      { url: `${origin}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
      { url: `${origin}/work`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
      { url: `${origin}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${origin}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ]
  }

  const entries: MetadataRoute.Sitemap = [
    { url: origin, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${origin}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/work`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ]

  if (FEATURES.ecommerce) {
    entries.push({ url: `${origin}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.7 })
    await appendProductUrls(entries, origin, tenant?.id ?? null)
  }

  if (FEATURES.bookings) {
    entries.push({ url: `${origin}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.6 })
  }

  if (FEATURES.pageBuilder) {
    await appendCustomPageUrls(entries, origin, tenant?.id ?? null)
  }

  return entries
}

async function appendProductUrls(
  entries: MetadataRoute.Sitemap,
  origin: string,
  tenantId: string | null,
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) return
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    let query = supabase.from("products").select("slug, updated_at").eq("status", "active")
    if (tenantId) query = query.eq("tenant_id", tenantId)
    const { data } = await query
    for (const p of data ?? []) {
      entries.push({
        url: `${origin}/shop/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  } catch {
    /* Supabase unavailable — skip dynamic products */
  }
}

async function appendCustomPageUrls(
  entries: MetadataRoute.Sitemap,
  origin: string,
  tenantId: string | null,
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) return
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    let query = supabase
      .from("custom_pages")
      .select("slug, updated_at")
      .eq("status", "published")
      .eq("is_homepage", false)
    if (tenantId) query = query.eq("tenant_id", tenantId)
    const { data } = await query
    for (const page of data ?? []) {
      entries.push({
        url: `${origin}/p/${page.slug}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      })
    }
  } catch {
    /* Supabase unavailable — skip dynamic pages */
  }
}
