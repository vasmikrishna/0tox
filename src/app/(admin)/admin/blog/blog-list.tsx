"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { BlogPost } from "@/types"
import { PaginatedList } from "@/components/paginated-list"

export function BlogList() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/admin/blog")
        if (!res.ok) throw new Error("Failed to fetch posts")
        const data = await res.json()
        setPosts(data.posts || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts")
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  async function deletePost(id: string) {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete post")
      setPosts(posts.filter(p => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post")
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
  }

  if (posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No blog posts yet — create your first one above.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <PaginatedList
        items={posts}
        pageSize={10}
        searchPlaceholder="Search posts by title, slug, or status..."
        testId="blog"
        searchText={(post) => `${post.title} ${post.slug} ${post.status}`}
      >
        {(pagePosts) => (
      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {pagePosts.map((post) => (
          <div key={post.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors group">
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/blog/${post.id}`}
                data-testid={`blog-edit-${post.id}`}
                className="block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate hover:underline">{post.title}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate">/{post.slug}</p>
              </Link>
            </div>
            <Badge
              variant={post.status === "published" ? "default" : "outline"}
              className="flex-shrink-0 capitalize"
            >
              {post.status}
            </Badge>
            <span className="text-xs text-muted-foreground flex-shrink-0 w-28 text-right hidden sm:block">
              {formatDate(post.updated_at || post.created_at)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`blog-delete-${post.id}`}
              onClick={() => deletePost(post.id)}
              disabled={deleting === post.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
        )}
      </PaginatedList>
    </div>
  )
}
