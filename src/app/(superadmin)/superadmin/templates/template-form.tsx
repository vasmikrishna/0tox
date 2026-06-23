"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, CheckCircle, Archive, Eye } from "lucide-react"
import type { GalleryTemplate, TemplateCategory, TemplateStyle, ContentStatus } from "@/types"
import Link from "next/link"

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "landing", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
  { value: "business", label: "Business" },
  { value: "coming-soon", label: "Coming Soon" },
  { value: "blog", label: "Blog" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "event", label: "Event" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
]

const STYLES: { value: TemplateStyle; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "warm", label: "Warm" },
  { value: "elegant", label: "Elegant" },
  { value: "playful", label: "Playful" },
  { value: "corporate", label: "Corporate" },
  { value: "dark", label: "Dark" },
]

const INDUSTRIES = [
  "general", "restaurant", "salon", "photography", "professional",
  "retail", "fitness", "healthcare", "consulting", "technology", "education",
]

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

interface TemplateFormProps {
  initial?: GalleryTemplate
}

export function TemplateForm({ initial }: TemplateFormProps) {
  const router = useRouter()
  const isEditing = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugDirty, setSlugDirty] = useState(isEditing)
  const [description, setDescription] = useState(initial?.description ?? "")
  const [category, setCategory] = useState<TemplateCategory>(initial?.category ?? "landing")
  const [industry, setIndustry] = useState(initial?.industry ?? "general")
  const [style, setStyle] = useState<TemplateStyle>(initial?.style ?? "modern")
  const [html, setHtml] = useState(initial?.html ?? "")
  const [css, setCss] = useState(initial?.css ?? "")
  const [previewUrl, setPreviewUrl] = useState(initial?.preview_url ?? "")
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "")
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "draft")
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(true)

  function setNameAndSlug(value: string) {
    setName(value)
    if (!slugDirty) setSlug(slugify(value))
  }

  async function handleSave(newStatus?: ContentStatus) {
    if (!name.trim() || !slug.trim() || !html.trim()) {
      setError("Name, slug, and HTML are required")
      return
    }
    setError("")
    setSaving(true)

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      category,
      industry,
      style,
      html: html.trim(),
      css: css.trim(),
      preview_url: previewUrl.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      sort_order: sortOrder,
      status: newStatus ?? status,
      featured,
    }

    try {
      const url = isEditing
        ? `/api/superadmin/templates/${initial.id}`
        : "/api/superadmin/templates"
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save")
        return
      }
      if (newStatus) setStatus(newStatus)
      if (!isEditing) {
        router.push(`/superadmin/templates/${data.template.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this template permanently?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/templates/${initial!.id}`, { method: "DELETE" })
      if (res.ok) router.push("/superadmin/templates")
      else setError("Failed to delete")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const previewSrcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif;}${css}</style></head><body>${html}</body></html>`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/superadmin/templates"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Template" : "New Page Template"}
            </h1>
            {isEditing && (
              <div className="flex gap-2 mt-1">
                <Badge variant={status === "approved" ? "success" : status === "archived" ? "destructive" : "outline"}>
                  {status}
                </Badge>
                {featured && <Badge variant="default">Featured</Badge>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              {status !== "approved" && (
                <Button size="sm" variant="default" disabled={saving} onClick={() => handleSave("approved")} data-testid="approve-template-btn">
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
              )}
              {status !== "archived" && (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSave("archived")} data-testid="archive-template-btn">
                  <Archive className="h-4 w-4" /> Archive
                </Button>
              )}
              {status === "archived" && (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSave("draft")}>
                  Unarchive
                </Button>
              )}
            </>
          )}
          <Button size="sm" variant="brand" disabled={saving || !name.trim() || !slug.trim() || !html.trim()} onClick={() => handleSave()} data-testid="save-template-btn">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setNameAndSlug(e.target.value)} placeholder="e.g. Dark Restaurant Landing" data-testid="template-name-input" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugDirty(true) }} placeholder="dark-restaurant-landing" data-testid="template-slug-input" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" data-testid="template-desc-input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                    <SelectTrigger data-testid="template-category-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger data-testid="template-industry-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Style</Label>
                  <Select value={style} onValueChange={(v) => setStyle(v as TemplateStyle)}>
                    <SelectTrigger data-testid="template-style-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dark, modern, gradient" data-testid="template-tags-input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} data-testid="template-sort-input" />
                </div>
                <div>
                  <Label>Preview Image URL</Label>
                  <Input value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://..." data-testid="template-preview-url-input" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer" data-testid="template-featured-toggle">
                    <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded" />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">HTML</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={14} value={html} onChange={(e) => setHtml(e.target.value)} placeholder="<div class='s9-site'>...</div>" className="font-mono text-xs" data-testid="template-html-editor" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">CSS</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={10} value={css} onChange={(e) => setCss(e.target.value)} placeholder=".s9-site { ... }" className="font-mono text-xs" data-testid="template-css-editor" />
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="border-destructive/30">
              <CardContent className="pt-6">
                <Button variant="destructive" size="sm" disabled={saving} onClick={handleDelete} data-testid="delete-template-btn">
                  Delete permanently
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Live Preview</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)} data-testid="toggle-preview-btn">
                <Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Show"}
              </Button>
            </CardHeader>
            {showPreview && html.trim() && (
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-white">
                  <iframe title="Template preview" srcDoc={previewSrcDoc} sandbox="" className="w-full" style={{ height: "600px" }} data-testid="template-preview-iframe" />
                </div>
              </CardContent>
            )}
            {showPreview && !html.trim() && (
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Add HTML to see a preview
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
