"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { BlogEditor } from "@/components/admin/blog-editor"
import { Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlogPost } from "@/types"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface BlogFormProps {
  mode: "create" | "edit"
  id?: string
}

export function BlogForm({ mode, id }: BlogFormProps) {
  const router = useRouter()
  const [post, setPost] = useState<Partial<BlogPost>>({
    title: "",
    slug: "",
    excerpt: "",
    content_html: "",
    content_json: undefined,
    cover_image_url: "",
    author_name: "",
    tags: [],
    status: "draft",
    meta_title: "",
    meta_description: "",
    og_image_url: "",
    canonical_url: "",
    noindex: false,
  })
  const [slugDirty, setSlugDirty] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [seoOpen, setSeoOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(mode === "edit")
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  // Load post data if editing
  useEffect(() => {
    if (mode !== "edit" || !id) return
    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/blog/${id}`)
        if (!res.ok) throw new Error("Failed to fetch post")
        const data = await res.json()
        setPost(data.post)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post")
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [mode, id, setLoading])

  function updateTitle(title: string) {
    setPost(p => ({ ...p, title }))
    if (!slugDirty) {
      setPost(p => ({ ...p, slug: slugify(title) }))
    }
  }

  async function uploadCoverImage(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/build/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setPost(p => ({ ...p, cover_image_url: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function saveBlog() {
    if (!post.title?.trim()) {
      setError("Title is required")
      return
    }
    if (!post.slug?.trim()) {
      setError("Slug is required")
      return
    }
    if (!post.content_html?.trim()) {
      setError("Content is required")
      return
    }

    setSaving(true)
    setError("")
    try {
      const body = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content_html: post.content_html,
        content_json: post.content_json,
        cover_image_url: post.cover_image_url || null,
        author_name: post.author_name || null,
        tags: post.tags || [],
        status: post.status || "draft",
        meta_title: post.meta_title || null,
        meta_description: post.meta_description || null,
        og_image_url: post.og_image_url || null,
        canonical_url: post.canonical_url || null,
        noindex: post.noindex || false,
      }

      const res = await fetch(
        mode === "create"
          ? "/api/admin/blog"
          : `/api/admin/blog/${id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Save failed")
      }

      const data = await res.json()
      if (mode === "create") {
        router.push(`/admin/blog/${data.post.id}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  if (loading && mode === "edit") {
    return <div className="text-center py-12 text-muted-foreground">Loading post...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{mode === "create" ? "New Blog Post" : "Edit Blog Post"}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="blog-field-title" className="mb-2 block">Title *</Label>
            <Input
              id="blog-field-title"
              data-testid="blog-field-title"
              placeholder="Blog post title"
              value={post.title || ""}
              onChange={e => updateTitle(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="blog-field-slug" className="mb-2 block">Slug *</Label>
            <Input
              id="blog-field-slug"
              data-testid="blog-field-slug"
              placeholder="auto-generated-slug"
              value={post.slug || ""}
              onChange={e => {
                setPost(p => ({ ...p, slug: e.target.value }))
                setSlugDirty(true)
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">Auto-generated from title or customize manually</p>
          </div>

          {/* Excerpt */}
          <div>
            <Label htmlFor="blog-field-excerpt" className="mb-2 block">Excerpt</Label>
            <Textarea
              id="blog-field-excerpt"
              data-testid="blog-field-excerpt"
              placeholder="Short summary for previews"
              value={post.excerpt || ""}
              onChange={e => setPost(p => ({ ...p, excerpt: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Author Name */}
          <div>
            <Label htmlFor="blog-field-author_name" className="mb-2 block">Author Name</Label>
            <Input
              id="blog-field-author_name"
              data-testid="blog-field-author_name"
              placeholder="e.g. John Doe"
              value={post.author_name || ""}
              onChange={e => setPost(p => ({ ...p, author_name: e.target.value }))}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="blog-field-tags" className="mb-2 block">Tags</Label>
            <div className="space-y-2">
              <Input
                id="blog-field-tags"
                data-testid="blog-field-tags"
                placeholder="Enter tags separated by commas"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onBlur={() => {
                  if (tagInput.trim()) {
                    const newTags = tagInput
                      .split(",")
                      .map(t => t.trim())
                      .filter(Boolean)
                    setPost(p => ({ ...p, tags: [...(p.tags || []), ...newTags] }))
                    setTagInput("")
                  }
                }}
              />
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => setPost(p => ({ ...p, tags: p.tags?.filter((_, idx) => idx !== i) }))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <Label htmlFor="blog-field-cover_image" className="mb-2 block">Cover Image</Label>
            <div className="flex gap-2">
              <Input
                id="blog-field-cover_image"
                data-testid="blog-field-cover_image"
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={e => {
                  const file = e.currentTarget.files?.[0]
                  if (file) uploadCoverImage(file)
                }}
              />
            </div>
            {post.cover_image_url && (
              <div className="mt-3">
                <img
                  src={post.cover_image_url}
                  alt="Cover"
                  className="h-32 w-full object-cover rounded-lg border border-border"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="blog-field-status" className="mb-2 block">Status</Label>
            <select
              id="blog-field-status"
              data-testid="blog-field-status"
              value={post.status || "draft"}
              onChange={e => setPost(p => ({ ...p, status: e.target.value as "draft" | "published" }))}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Content *</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogEditor
            value={post.content_html || ""}
            json={post.content_json}
            onChange={(html, json) => setPost(p => ({ ...p, content_html: html, content_json: json }))}
          />
        </CardContent>
      </Card>

      {/* SEO Section */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setSeoOpen(!seoOpen)}
            className="flex items-center justify-between w-full hover:text-foreground transition-colors"
            type="button"
          >
            <CardTitle>SEO Settings</CardTitle>
            <ChevronDown
              className={cn("h-5 w-5 text-muted-foreground transition-transform", seoOpen && "rotate-180")}
            />
          </button>
        </CardHeader>
        {seoOpen && (
          <CardContent className="space-y-4 border-t border-border pt-6">
            {/* Meta Title */}
            <div>
              <Label htmlFor="blog-seo-meta_title" className="mb-2 block">Meta Title</Label>
              <Input
                id="blog-seo-meta_title"
                data-testid="blog-seo-meta_title"
                placeholder="For search engines"
                value={post.meta_title || ""}
                onChange={e => setPost(p => ({ ...p, meta_title: e.target.value }))}
              />
            </div>

            {/* Meta Description */}
            <div>
              <Label htmlFor="blog-seo-meta_description" className="mb-2 block">Meta Description</Label>
              <Textarea
                id="blog-seo-meta_description"
                data-testid="blog-seo-meta_description"
                placeholder="Summary for search engines and social media"
                value={post.meta_description || ""}
                onChange={e => setPost(p => ({ ...p, meta_description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* OG Image */}
            <div>
              <Label htmlFor="blog-seo-og_image_url" className="mb-2 block">Open Graph Image URL</Label>
              <Input
                id="blog-seo-og_image_url"
                data-testid="blog-seo-og_image_url"
                placeholder="https://..."
                value={post.og_image_url || ""}
                onChange={e => setPost(p => ({ ...p, og_image_url: e.target.value }))}
              />
            </div>

            {/* Canonical URL */}
            <div>
              <Label htmlFor="blog-seo-canonical_url" className="mb-2 block">Canonical URL</Label>
              <Input
                id="blog-seo-canonical_url"
                data-testid="blog-seo-canonical_url"
                placeholder="https://..."
                value={post.canonical_url || ""}
                onChange={e => setPost(p => ({ ...p, canonical_url: e.target.value }))}
              />
            </div>

            {/* No Index */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blog-seo-noindex"
                data-testid="blog-seo-noindex"
                checked={post.noindex || false}
                onChange={e => setPost(p => ({ ...p, noindex: e.target.checked }))}
                className="h-4 w-4 rounded border border-border"
              />
              <Label htmlFor="blog-seo-noindex" className="cursor-pointer">
                Hide from search engines (noindex)
              </Label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          data-testid="blog-save"
          onClick={saveBlog}
          disabled={saving}
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {saving ? "Saving..." : mode === "create" ? "Create Post" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
