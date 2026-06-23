import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSiteSettings } from "@/lib/site-settings"
import { getCurrentTenant, getTenantSlug } from "@/lib/tenant"
import { getCanonicalOrigin, buildArticleJsonLd } from "@/lib/seo"
import { sanitizeHtml } from "@/lib/sanitize-html"
import type { BlogPost } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getBlogPost(slug: string) {
  const tenant = await getCurrentTenant().catch(() => null)
  try {
    if (!supabaseConfigured()) {
      return null
    }
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- blog_posts not in generated DB types
    let query = (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")

    if (tenant) query = query.eq("tenant_id", tenant.id)

    const { data } = await query.maybeSingle()
    return (data ?? null) as BlogPost | null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return { title: "Post not found" }

  const tenant = await getCurrentTenant().catch(() => null)
  const tenantSlug = await getTenantSlug()
  const origin = getCanonicalOrigin(tenant, tenantSlug)
  const canonicalUrl = post.canonical_url || `${origin}/blog/${slug}`
  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ""
  const image = post.og_image_url || post.cover_image_url

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(post.noindex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) notFound()

  const tenant = await getCurrentTenant().catch(() => null)
  const tenantSlug = await getTenantSlug()
  const settings = await getSiteSettings()
  const origin = getCanonicalOrigin(tenant, tenantSlug)
  const publisherName = settings.site_name ?? tenant?.name ?? "Site9"
  const publisherLogo = tenant?.logo_url
  const canonicalUrl = post.canonical_url || `${origin}/blog/${slug}`

  const jsonLd = buildArticleJsonLd({
    url: canonicalUrl,
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image_url || post.cover_image_url,
    authorName: post.author_name,
    publisherName,
    publisherLogo,
    datePublished: post.published_at,
    dateModified: post.updated_at,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="back-to-blog"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>

        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden border border-border bg-muted aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          {post.author_name && <span>{post.author_name}</span>}
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </div>

        {/* Tags */}
        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-sm max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-2"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content_html) }}
        />
      </article>
    </>
  )
}
