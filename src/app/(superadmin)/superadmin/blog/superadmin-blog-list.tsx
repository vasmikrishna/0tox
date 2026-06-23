"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { BlogPost } from "@/types"

interface BlogPostWithTenant extends BlogPost {
  tenant_name?: string
}

export function SuperadminBlogList() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPostWithTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/superadmin/blog")
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

  async function togglePublish(post: BlogPostWithTenant) {
    setUpdating(post.id)
    try {
      const newStatus = post.status === "published" ? "draft" : "published"
      const res = await fetch(`/api/superadmin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update post")
      const data = await res.json()
      setPosts(posts.map(p => p.id === post.id ? data.post : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post")
    } finally {
      setUpdating(null)
    }
  }

  async function deletePost(id: string) {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/superadmin/blog/${id}`, { method: "DELETE" })
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
          No blog posts found.
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
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Tenant</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Updated</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground truncate">/{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {post.tenant_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={post.status === "published" ? "default" : "outline"}
                      className="capitalize"
                    >
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(post.updated_at || post.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        data-testid={`blog-publish-${post.id}`}
                        onClick={() => togglePublish(post)}
                        disabled={updating === post.id}
                      >
                        {updating === post.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        {post.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        data-testid={`blog-delete-${post.id}`}
                        onClick={() => deletePost(post.id)}
                        disabled={deleting === post.id}
                      >
                        {deleting === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
