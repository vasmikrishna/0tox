"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Save, Trash2, Eye, ExternalLink, Home,
  Wand2, Code2, MousePointerClick, Upload, ImageIcon,
} from "lucide-react"
import type { CustomPage } from "@/types"
import { PAGE_TEMPLATES, getTemplate } from "@/lib/page-templates"
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize-html"
import { buildEditorSrcDoc } from "@/lib/editor-inject"

interface SelectedEl {
  editKey: string
  content: string
  tagName: string
  s9Type: "text" | "image"
}

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
  const [showCode, setShowCode] = useState(false)

  // Visual editor state
  const [selectedEl, setSelectedEl] = useState<SelectedEl | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const htmlResolveRef = useRef<((h: string) => void) | null>(null)

  const hasEditMarkers = html.includes("data-s9-edit")

  const srcDoc = useMemo(() => {
    if (hasEditMarkers) return buildEditorSrcDoc(html, css)
    const safeCss = sanitizeCss(css)
    const safeHtml = sanitizeHtml(html)
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}${safeCss}</style></head><body>${safeHtml}</body></html>`
  }, [html, css, hasEditMarkers])

  // postMessage listener
  const handleMessage = useCallback((e: MessageEvent) => {
    const d = e.data
    if (!d || typeof d.type !== "string" || !d.type.startsWith("s9:")) return
    if (d.type === "s9:select") {
      setSelectedEl({ editKey: d.editKey, content: d.content, tagName: d.tagName, s9Type: d.s9Type === "image" ? "image" : "text" })
    } else if (d.type === "s9:deselect") {
      setSelectedEl(null)
    } else if (d.type === "s9:html") {
      htmlResolveRef.current?.(d.html)
      htmlResolveRef.current = null
    }
  }, [])

  useEffect(() => {
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [handleMessage])

  function postToIframe(msg: Record<string, unknown>) {
    iframeRef.current?.contentWindow?.postMessage(msg, "*")
  }

  function markDirty() { setSaved(false); setError("") }

  function insertTemplate(key: string) {
    if (!key) return
    const tpl = getTemplate(key)
    setHtml(tpl.html); setCss(tpl.css); setInsertKey(""); markDirty()
  }

  // Sync iframe edits back to html state
  async function syncFromIframe(): Promise<string> {
    if (!hasEditMarkers || !iframeRef.current?.contentWindow) return html
    return new Promise<string>((resolve) => {
      htmlResolveRef.current = resolve
      postToIframe({ type: "s9:getHtml" })
      setTimeout(() => { if (htmlResolveRef.current) { htmlResolveRef.current = null; resolve(html) } }, 2000)
    })
  }

  // CRUD
  async function patch(partial: Record<string, unknown>): Promise<CustomPage | null> {
    const res = await fetch(`/api/admin/pages/${page.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Save failed"); return null }
    return data.page as CustomPage
  }

  async function handleSave() {
    setSaving(true); setError("")
    const currentHtml = await syncFromIframe()
    const ok = await patch({ title, slug, html: currentHtml, css })
    setSaving(false)
    if (ok) {
      setHtml(currentHtml)
      if (ok.slug) setSlug(ok.slug)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  async function togglePublish() {
    const next = status === "published" ? "draft" : "published"
    setSaving(true)
    const currentHtml = await syncFromIframe()
    const ok = await patch({ title, slug, html: currentHtml, css, status: next })
    setSaving(false)
    if (ok) {
      setHtml(currentHtml); setStatus(next)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  async function toggleHomepage() {
    setSaving(true)
    const ok = await patch({ is_homepage: !isHomepage })
    setSaving(false)
    if (ok) {
      setIsHomepage(!isHomepage)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this page? This cannot be undone.")) return
    setSaving(true)
    const res = await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" })
    setSaving(false)
    if (res.ok) router.push("/admin/pages")
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Delete failed") }
  }

  // AI generate full page
  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true); setError("")
    try {
      const res = await fetch("/api/build/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: { name: title || "My Page", about: aiPrompt } }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "AI generation failed"); return }
      if (data.html) setHtml(data.html)
      if (data.css) setCss(data.css)
      if (data.raw) { setHtml(data.raw); setCss("") }
      setAiPrompt(""); markDirty()
    } catch { setError("Could not reach AI.") }
    finally { setAiLoading(false) }
  }

  // Element editing
  function handleElementUpdate(editKey: string, content: string) {
    postToIframe({ type: "s9:update", editKey, content }); markDirty()
  }

  function handleElementAttr(editKey: string, attr: string, value: string) {
    postToIframe({ type: "s9:updateAttr", editKey, attr, value }); markDirty()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button data-testid="page-back-btn" onClick={() => router.push("/admin/pages")} className="text-muted-foreground hover:text-foreground flex-shrink-0" title="Back to pages">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{title || "Untitled page"}</h1>
              <Badge variant={status === "published" ? "default" : "outline"} className="capitalize flex-shrink-0">{status}</Badge>
              {isHomepage && <Badge variant="brand" className="flex-shrink-0 text-[10px]">Homepage</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">/p/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "published" && (
            <a href={`/p/${slug}`} target="_blank" rel="noreferrer" data-testid="page-view-link" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
          )}
          {saved && <span data-testid="page-saved-indicator" className="text-xs text-green-600 font-medium">Saved ✓</span>}
          <Button data-testid="page-save-btn" onClick={handleSave} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}</Button>
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
        <div className="space-y-1.5"><Label htmlFor="page-title">Title</Label><Input id="page-title" data-testid="page-title-input" value={title} onChange={(e) => { setTitle(e.target.value); markDirty() }} /></div>
        <div className="space-y-1.5"><Label htmlFor="page-slug">Slug</Label><Input id="page-slug" data-testid="page-slug-input" value={slug} onChange={(e) => { setSlug(e.target.value); markDirty() }} /></div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button data-testid="page-publish-toggle" variant={status === "published" ? "outline" : "brand"} size="sm" onClick={togglePublish} disabled={saving}>
          <Eye className="h-3.5 w-3.5" /> {status === "published" ? "Unpublish" : "Publish"}
        </Button>
        <Button data-testid="page-homepage-toggle" variant={isHomepage ? "default" : "outline"} size="sm" onClick={toggleHomepage} disabled={saving}>
          <Home className="h-3.5 w-3.5" /> {isHomepage ? "Homepage ✓" : "Set as homepage"}
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <select data-testid="page-insert-template-select" value={insertKey} onChange={(e) => insertTemplate(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
            <option value="">Insert template…</option>
            {PAGE_TEMPLATES.map((tpl) => (<option key={tpl.key} value={tpl.key}>{tpl.name}</option>))}
          </select>
          <Button size="sm" variant={showCode ? "default" : "outline"} onClick={() => setShowCode(!showCode)}>
            <Code2 className="h-3.5 w-3.5" /> Code
          </Button>
          <Button data-testid="page-delete-btn" variant="ghost" size="sm" onClick={handleDelete} disabled={saving} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* AI Generate bar */}
      <div className="flex gap-2">
        <Input placeholder="Describe the page you want AI to create…" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()} data-testid="page-ai-prompt" />
        <Button variant="brand" size="sm" disabled={aiLoading || !aiPrompt.trim()} onClick={handleAiGenerate} data-testid="page-ai-generate">
          <Wand2 className="h-3.5 w-3.5" /> {aiLoading ? "Generating…" : "Generate"}
        </Button>
      </div>

      {/* Visual editor + panel / code */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Preview */}
        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-white">
          <iframe
            ref={iframeRef}
            data-testid="page-preview-iframe"
            title="Page preview"
            srcDoc={srcDoc}
            sandbox={hasEditMarkers ? "allow-scripts" : ""}
            className="w-full border-0"
            style={{ height: "600px" }}
          />
        </div>

        {/* Right panel */}
        <div className="w-full shrink-0 rounded-xl border border-border bg-card lg:w-80">
          {hasEditMarkers ? (
            <VisualEditorPanel
              selected={selectedEl}
              onUpdate={handleElementUpdate}
              onUpdateAttr={handleElementAttr}
              pageName={title}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <MousePointerClick className="h-8 w-8 opacity-30" />
              <p className="text-sm">Visual editing is available when you generate a page with AI or use a curated template.</p>
              <p className="text-xs">Use the code editor or AI generate bar above to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible code editor */}
      {showCode && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="page-html">HTML</Label>
            <textarea id="page-html" data-testid="page-html-input" value={html} onChange={(e) => { setHtml(e.target.value); markDirty() }} spellCheck={false} className="w-full h-72 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-y" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-css">CSS</Label>
            <textarea id="page-css" data-testid="page-css-input" value={css} onChange={(e) => { setCss(e.target.value); markDirty() }} spellCheck={false} className="w-full h-72 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-y" />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline visual editor panel (reuses the same pattern as the builder)
// ---------------------------------------------------------------------------

function VisualEditorPanel({
  selected, onUpdate, onUpdateAttr, pageName,
}: {
  selected: SelectedEl | null
  onUpdate: (key: string, content: string) => void
  onUpdateAttr: (key: string, attr: string, val: string) => void
  pageName: string
}) {
  if (!selected) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
        <MousePointerClick className="h-8 w-8" />
        <p className="text-sm">Click any element in the preview to edit it</p>
      </div>
    )
  }
  return <VisualEditorInner key={selected.editKey} selected={selected} onUpdate={onUpdate} onUpdateAttr={onUpdateAttr} pageName={pageName} />
}

function VisualEditorInner({
  selected, onUpdate, onUpdateAttr, pageName,
}: {
  selected: SelectedEl
  onUpdate: (key: string, content: string) => void
  onUpdateAttr: (key: string, attr: string, val: string) => void
  pageName: string
}) {
  const [editValue, setEditValue] = useState(selected.content)
  const [imageUrl, setImageUrl] = useState(selected.s9Type === "image" ? selected.content : "")
  const [aiInstruction, setAiInstruction] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [err, setErr] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function aiRewrite() {
    if (!aiInstruction.trim()) return
    setErr(""); setAiLoading(true)
    try {
      const res = await fetch("/api/build/edit-element", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentContent: editValue, instruction: aiInstruction, businessName: pageName }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(d.error ?? "Failed"); return }
      setEditValue(d.content); onUpdate(selected.editKey, d.content); setAiInstruction("")
    } catch { setErr("AI unreachable.") }
    finally { setAiLoading(false) }
  }

  async function uploadImage(file: File) {
    setErr(""); setUploadLoading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/build/upload", { method: "POST", body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(d.error ?? "Upload failed"); return }
      setImageUrl(d.url); onUpdateAttr(selected.editKey, "src", d.url)
    } catch { setErr("Upload failed.") }
    finally { setUploadLoading(false) }
  }

  const zoneName = selected.editKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Editing</p>
        <p className="font-semibold">{zoneName}</p>
      </div>
      {err && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{err}</p>}

      {selected.s9Type === "text" && (
        <>
          <Textarea rows={5} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm" />
          <Button size="sm" variant="brand" onClick={() => onUpdate(selected.editKey, editValue)}>Update</Button>
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">AI Rewrite</p>
            <Input placeholder="e.g. Make it shorter…" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} onKeyDown={(e) => e.key === "Enter" && aiRewrite()} />
            <Button size="sm" variant="outline" className="mt-2 w-full" loading={aiLoading} disabled={!aiInstruction.trim()} onClick={aiRewrite}>
              <Wand2 className="h-3.5 w-3.5" /> Rewrite with AI
            </Button>
          </div>
        </>
      )}

      {selected.s9Type === "image" && (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl || selected.content} alt="Current" className="aspect-video w-full object-cover" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
          <Button size="sm" variant="brand" loading={uploadLoading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload image
          </Button>
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Or paste an image URL</p>
            <div className="flex gap-2">
              <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <Button size="sm" variant="outline" onClick={() => { if (imageUrl.trim()) onUpdateAttr(selected.editKey, "src", imageUrl.trim()) }}>
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
