import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/site-settings"
import { getCurrentTenant, getTenantSlug } from "@/lib/tenant"
import { getCanonicalOrigin } from "@/lib/seo"
import type { BlogPost } from "@/types"
import { BlogIndexClient } from "./blog-index-client"

type BlogPostCard = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "published_at">

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getBlogPosts(): Promise<BlogPostCard[]> {
  const tenant = await getCurrentTenant().catch(() => null)
  try {
    if (!supabaseConfigured()) {
      return []
    }
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- blog_posts not in generated DB types
    let query = (supabase as any)
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })

    if (tenant) query = query.eq("tenant_id", tenant.id)

    const { data } = await query
    return (data ?? []) as BlogPostCard[]
  } catch {
    return []
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const slug = await getTenantSlug()
  const tenant = await getCurrentTenant().catch(() => null)
  const origin = getCanonicalOrigin(tenant, slug)
  const siteName = settings.site_name ?? "Site9"

  return {
    title: "Blog",
    description: settings.site_tagline ?? `Latest from ${siteName}`,
    alternates: { canonical: `${origin}/blog` },
    openGraph: {
      title: "Blog",
      description: settings.site_tagline ?? `Latest from ${siteName}`,
      type: "website",
    },
  }
}

export default async function BlogIndexPage() {
  const [posts, settings] = await Promise.all([getBlogPosts(), getSiteSettings()])
  const siteName = settings.site_name ?? "Site9"

  return (
    <div style={{ background: "var(--site-bg)", minHeight: "60vh" }}>
      {/* Hero banner */}
      <section style={{ background: "var(--site-primary)" }} className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold text-white">Blog</h1>
          <p className="mt-3 text-white/80 max-w-2xl text-lg">
            {settings.site_tagline ?? `Latest articles and insights from ${siteName}`}
          </p>
        </div>
      </section>

      {/* Posts grid + search/pagination */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <BlogIndexClient posts={posts} />
      </section>
    </div>
  )
}
