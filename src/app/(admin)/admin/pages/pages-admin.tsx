"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, LayoutTemplate, Search } from "lucide-react"
import { PAGE_TEMPLATES } from "@/lib/page-templates"
import type { GalleryTemplateMeta } from "@/types"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type Tab = "starter" | "gallery"

export function PagesAdmin() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugDirty, setSlugDirty] = useState(false)
  const [template, setTemplate] = useState(PAGE_TEMPLATES[0]?.key ?? "blank")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("starter")

  const [galleryTemplates, setGalleryTemplates] = useState<GalleryTemplateMeta[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [gallerySearch, setGallerySearch] = useState("")
  const [selectedGallery, setSelectedGallery] = useState<GalleryTemplateMeta | null>(null)

  useEffect(() => {
    if (tab !== "gallery" || !open) return
    setGalleryLoading(true)
    const params = new URLSearchParams({ limit: "50" })
    if (gallerySearch) params.set("search", gallerySearch)
    fetch(`/api/templates?${params}`)
      .then((r) => r.json())
      .then((data) => setGalleryTemplates(data.templates ?? []))
      .finally(() => setGalleryLoading(false))
  }, [tab, open, gallerySearch])

  function setTitleAndSlug(value: string) {
    setTitle(value)
    if (!slugDirty) setSlug(slugify(value))
  }

  async function create() {
    if (!title.trim()) return
    setCreating(true)
    setError("")
    try {
      let body: Record<string, string>
      if (tab === "gallery" && selectedGallery) {
        const tplRes = await fetch(`/api/templates/${selectedGallery.slug}`)
        const tplData = await tplRes.json()
        if (!tplRes.ok) {
          setError("Failed to load template")
          setCreating(false)
          return
        }
        body = {
          title: title.trim(),
          slug: slug.trim(),
          template: `gallery:${selectedGallery.slug}`,
          html: tplData.template.html,
          css: tplData.template.css,
        }
      } else {
        body = { title: title.trim(), slug: slug.trim(), template }
      }

      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to create page")
        setCreating(false)
        return
      }
      router.push(`/admin/pages/${data.page.id}`)
    } catch {
      setError("Failed to create page")
      setCreating(false)
    }
  }

  if (!open) {
    return (
      <Button data-testid="page-new-btn" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New page
      </Button>
    )
  }

  const canCreate = tab === "starter"
    ? !!title.trim()
    : !!title.trim() && !!selectedGallery

  return (
    <>
      <Button data-testid="page-new-btn" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New page
      </Button>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">New page</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Pick a starting template, then customise in the editor.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-page-title">Title</Label>
            <Input
              id="new-page-title"
              data-testid="page-new-title-input"
              value={title}
              onChange={(e) => setTitleAndSlug(e.target.value)}
              placeholder="About us"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-page-slug">Slug</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/p/</span>
              <Input
                id="new-page-slug"
                data-testid="page-new-slug-input"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugDirty(true) }}
                placeholder="about-us"
              />
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setTab("starter")}
              data-testid="page-new-tab-starter"
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === "starter" ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Starter Templates
            </button>
            <button
              onClick={() => setTab("gallery")}
              data-testid="page-new-tab-gallery"
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === "gallery" ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutTemplate className="h-3.5 w-3.5 inline mr-1" />
              Browse Gallery
            </button>
          </div>

          {tab === "starter" ? (
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-2 gap-3">
                {PAGE_TEMPLATES.map((tpl) => (
                  <label
                    key={tpl.key}
                    data-testid={`page-new-template-${tpl.key}`}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                      template === tpl.key ? "border-foreground" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={tpl.key}
                      checked={template === tpl.key}
                      onChange={() => setTemplate(tpl.key)}
                      className="sr-only"
                    />
                    <p className="font-medium text-sm">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="Search gallery templates..."
                  className="pl-9"
                  data-testid="page-new-gallery-search"
                />
              </div>
              {galleryLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading templates...</div>
              ) : galleryTemplates.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No gallery templates available.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {galleryTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedGallery(tpl)}
                      data-testid={`page-new-gallery-${tpl.slug}`}
                      className={`text-left rounded-lg border-2 p-3 transition-colors ${
                        selectedGallery?.id === tpl.id ? "border-foreground" : "border-border hover:border-foreground/30"
                      }`}
                    >
                      {tpl.preview_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tpl.preview_url} alt={tpl.name} className="w-full aspect-video object-cover rounded-md mb-2" />
                      )}
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[9px]">{tpl.category}</Badge>
                        <Badge variant="outline" className="text-[9px]">{tpl.industry}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" data-testid="page-new-cancel-btn" onClick={() => setOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button data-testid="page-new-create-btn" onClick={create} disabled={!canCreate || creating}>
              {creating ? "Creating…" : "Create page"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
