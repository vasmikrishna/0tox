import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { CustomPage } from "@/types"
import { MOCK_CUSTOM_PAGES } from "@/lib/mock-data"
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize-html"
import { FormHandler } from "@/components/public/form-handler"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getPublishedPage(slug: string): Promise<CustomPage | null> {
  if (!supabaseConfigured()) {
    return MOCK_CUSTOM_PAGES.find((p) => p.slug === slug && p.status === "published") ?? null
  }
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const { getCurrentTenant } = await import("@/lib/tenant")
    const supabase = createClient()
    const tenant = await getCurrentTenant().catch(() => null)
    let query = supabase
      .from("custom_pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
    if (tenant?.id) query = query.eq("tenant_id", tenant.id)
    const { data } = await query.maybeSingle()
    return (data as CustomPage | null) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) return { title: "Page not found" }
  return {
    title: page.title,
    alternates: { canonical: `/p/${slug}` },
    openGraph: { title: page.title },
  }
}

export default async function CustomPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPublishedPage(slug)

  if (!page) notFound()

  return (
    <FormHandler>
      <style dangerouslySetInnerHTML={{ __html: sanitizeCss(page.css) }} />
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }} />
    </FormHandler>
  )
}
