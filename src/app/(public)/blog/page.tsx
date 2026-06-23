import Link from "next/link"
import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/site-settings"
import { getCurrentTenant, getTenantSlug } from "@/lib/tenant"
import { getCanonicalOrigin } from "@/lib/seo"
import type { BlogPost } from "@/types"

type BlogPostCard = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "published_at">

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getBlogPosts() {
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
  const posts = await getBlogPosts()

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground">Latest articles and insights</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts yet.</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div className="group overflow-hidden rounded-lg border border-border bg-card hover:shadow-md transition-shadow h-full flex flex-col">
                {/* Cover Image */}
                {post.cover_image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col flex-grow p-4">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  {post.published_at && (
                    <time className="text-xs text-muted-foreground">
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
