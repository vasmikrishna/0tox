"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ExternalLink, Plus, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BlogPanelPost {
  id: string
  slug: string
  title: string
  status: "draft" | "published"
  published_at: string | null
  updated_at?: string
  created_at: string
}

interface BlogPanelProps {
  /** The public-facing hostname for this tenant (e.g. "mybiz.site9.in") */
  host: string
}

export function BlogPanel({ host }: BlogPanelProps) {
  const [posts, setPosts] = useState<BlogPanelPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/blog")
        if (!res.ok) throw new Error("Failed to load blog posts")
        const data = await res.json() as { posts?: BlogPanelPost[] }
        setPosts(data.posts ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load posts")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const published = posts.filter((p) => p.status === "published")
  const drafts = posts.filter((p) => p.status === "draft")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <p className="text-sm font-semibold">Blog</p>
          <p className="text-xs text-muted-foreground">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1" data-testid="blog-panel-manage">
            <Link href="/admin/blog" target="_blank">
              <FileText className="h-3.5 w-3.5" /> Manage
            </Link>
          </Button>
          <Button asChild size="sm" variant="brand" className="h-7 text-xs gap-1" data-testid="blog-panel-new">
            <Link href="/admin/blog/new" target="_blank">
              <Plus className="h-3.5 w-3.5" /> New post
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12" data-testid="blog-panel-loading">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-xs text-destructive" data-testid="blog-panel-error">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center" data-testid="blog-panel-empty">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No blog posts yet</p>
            <p className="text-xs text-muted-foreground">Create your first post to get started.</p>
            <Button asChild size="sm" variant="brand" data-testid="blog-panel-empty-new">
              <Link href="/admin/blog/new" target="_blank">
                <Plus className="h-3.5 w-3.5" /> Write a post
              </Link>
            </Button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="divide-y divide-border">
            {published.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
                  Published ({published.length})
                </p>
                {published.map((post) => (
                  <PostRow key={post.id} post={post} host={host} />
                ))}
              </div>
            )}
            {drafts.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
                  Drafts ({drafts.length})
                </p>
                {drafts.map((post) => (
                  <PostRow key={post.id} post={post} host={host} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer — link to the public blog */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <a
          href={`https://${host}/blog`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="blog-panel-view-public"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View public blog
        </a>
      </div>
    </div>
  )
}

function PostRow({ post, host }: { post: BlogPanelPost; host: string }) {
  const displayDate = post.published_at ?? post.updated_at ?? post.created_at
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate leading-snug">{post.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(displayDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          variant={post.status === "published" ? "default" : "outline"}
          className="text-[10px] h-5 px-1.5 capitalize"
        >
          {post.status}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/admin/blog/${post.id}`}
            target="_blank"
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Edit post"
            data-testid={`blog-panel-edit-${post.id}`}
          >
            <FileText className="h-3.5 w-3.5" />
          </Link>
          {post.status === "published" && (
            <a
              href={`https://${host}/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="View live post"
              data-testid={`blog-panel-view-${post.id}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
