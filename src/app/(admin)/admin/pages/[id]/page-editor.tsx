"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Trash2, Eye, ExternalLink, Home } from "lucide-react"
import type { CustomPage } from "@/types"
import { PAGE_TEMPLATES, getTemplate } from "@/lib/page-templates"
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize-html"

export function PageEditor({ page, demoMode }: { page: CustomPage; demoMode: boolean }) {
  const router = useRouter()
  const [title, setTitle] = useState(page.title)
  const [slug, setSlug] = useState(page.slug)
  const [html, setHtml] = useState(page.html)
  const [css, setCss] = useState(page.css)
  const [status, setStatus] = useState<CustomPage["status"]>(page.status)
  const [isHomepage, setIsHomepage] = useState(page.is_homepage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [insertKey, setInsertKey] = useState("")

  const srcDoc = useMemo(() => {
    const safeCss = sanitizeCss(css)
    const safeHtml = sanitizeHtml(html)
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}${safeCss}</style></head><body>${safeHtml}</body></html>`
  }, [html, css])

  function markDirty() {
    setSaved(false)
    setError("")
  }

  function insertTemplate(key: string) {
    if (!key) return
    const tpl = getTemplate(key)
    setHtml(tpl.html)
    setCss(tpl.css)
    setInsertKey("")
    markDirty()
  }

  async function patch(partial: Record<string, unknown>): Promise<CustomPage | null> {
    const res = await fetch(`/api/admin/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return null
    }
    return data.page as CustomPage
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    const ok = await patch({ title, slug, html, css })
    setSaving(false)
    if (ok) {
      if (ok.slug) setSlug(ok.slug)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  async function togglePublish() {
    const next = status === "published" ? "draft" : "published"
    setSaving(true)
    // Persist current edits along with the status change.
    const ok = await patch({ title, slug, html, css, status: next })
    setSaving(false)
    if (ok) {
      setStatus(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  async function toggleHomepage() {
    const next = !isHomepage
    setSaving(true)
    const ok = await patch({ is_homepage: next })
    setSaving(false)
    if (ok) {
      setIsHomepage(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this page? This cannot be undone.")) return
    setSaving(true)
    const res = await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" })
    setSaving(false)
    if (res.ok) {
      router.push("/admin/pages")
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Delete failed")
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            data-testid="page-back-btn"
            onClick={() => router.push("/admin/pages")}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Back to pages"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{title || "Untitled page"}</h1>
              <Badge variant={status === "published" ? "default" : "outline"} className="capitalize flex-shrink-0">
                {status}
              </Badge>
              {isHomepage && <Badge variant="brand" className="flex-shrink-0 text-[10px]">Homepage</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">/p/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "published" && (
            <a
              href={`/p/${slug}`}
              target="_blank"
              rel="noreferrer"
              data-testid="page-view-link"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
          )}
          {saved && <span data-testid="page-saved-indicator" className="text-xs text-green-600 font-medium">Saved ✓</span>}
          <Button data-testid="page-save-btn" onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {demoMode && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Demo mode — changes are not persisted. Connect Supabase to save permanently.
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Meta row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="page-title">Title</Label>
          <Input
            id="page-title"
            data-testid="page-title-input"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty() }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="page-slug">Slug</Label>
          <Input
            id="page-slug"
            data-testid="page-slug-input"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); markDirty() }}
          />
        </div>
      </div>

      {/* Action toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          data-testid="page-publish-toggle"
          variant={status === "published" ? "outline" : "brand"}
          size="sm"
          onClick={togglePublish}
          disabled={saving}
        >
          <Eye className="h-3.5 w-3.5" /> {status === "published" ? "Unpublish" : "Publish"}
        </Button>
        <Button
          data-testid="page-homepage-toggle"
          variant={isHomepage ? "default" : "outline"}
          size="sm"
          onClick={toggleHomepage}
          disabled={saving}
        >
          <Home className="h-3.5 w-3.5" /> {isHomepage ? "Homepage ✓" : "Set as homepage"}
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <select
            data-testid="page-insert-template-select"
            value={insertKey}
            onChange={(e) => insertTemplate(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background"
          >
            <option value="">Insert template…</option>
            {PAGE_TEMPLATES.map((tpl) => (
              <option key={tpl.key} value={tpl.key}>{tpl.name}</option>
            ))}
          </select>
          <Button
            data-testid="page-delete-btn"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={saving}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="page-html">HTML</Label>
            <textarea
              id="page-html"
              data-testid="page-html-input"
              value={html}
              onChange={(e) => { setHtml(e.target.value); markDirty() }}
              spellCheck={false}
              className="w-full h-80 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-css">CSS</Label>
            <textarea
              id="page-css"
              data-testid="page-css-input"
              value={css}
              onChange={(e) => { setCss(e.target.value); markDirty() }}
              spellCheck={false}
              className="w-full h-52 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-y"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Live preview</Label>
          <div className="rounded-lg border border-border overflow-hidden bg-white" style={{ height: "calc(20rem + 13rem + 0.75rem)" }}>
            <iframe
              data-testid="page-preview-iframe"
              title="Page preview"
              srcDoc={srcDoc}
              sandbox=""
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
