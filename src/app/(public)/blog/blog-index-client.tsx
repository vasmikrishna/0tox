"use client"

import Link from "next/link"
import { PaginatedList } from "@/components/paginated-list"
import type { BlogPost } from "@/types"

type BlogPostCard = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "published_at">

export function BlogIndexClient({ posts }: { posts: BlogPostCard[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16" data-testid="blog-empty">
        <p style={{ color: "var(--site-text)" }} className="opacity-60 text-base">
          No posts published yet. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <PaginatedList
      items={posts}
      pageSize={9}
      searchPlaceholder="Search posts by title or excerpt…"
      testId="blog"
      searchText={(post) => `${post.title} ${post.excerpt ?? ""}`}
    >
      {(pagePosts) => (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="blog-grid">
          {pagePosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} data-testid={`blog-post-${post.id}`}>
              <article
                className="group overflow-hidden rounded-xl border h-full flex flex-col transition-shadow hover:shadow-lg"
                style={{
                  borderColor: "color-mix(in srgb, var(--site-primary) 15%, transparent)",
                  background: "#fff",
                }}
              >
                {/* Cover Image */}
                {post.cover_image_url && (
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col flex-grow p-5">
                  <h2
                    className="text-lg font-semibold mb-2 leading-snug group-hover:underline"
                    style={{ color: "var(--site-primary)" }}
                  >
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm mb-4 flex-grow line-clamp-3" style={{ color: "var(--site-text)", opacity: 0.75 }}>
                      {post.excerpt}
                    </p>
                  )}
                  {post.published_at && (
                    <time
                      className="text-xs mt-auto"
                      style={{ color: "var(--site-text)", opacity: 0.5 }}
                      dateTime={post.published_at}
                    >
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </PaginatedList>
  )
}
