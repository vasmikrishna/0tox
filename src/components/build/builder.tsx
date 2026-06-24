"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight, Send, Wand2, Upload, ImageIcon, MousePointerClick,
  ExternalLink, Sparkles, Link2, Trash2, Monitor, Tablet, Smartphone,
  LayoutGrid, LayoutTemplate, ChevronUp, ChevronDown, Search, FileText,
} from "lucide-react"
import { EDITOR_OVERLAY_CSS, EDITOR_SCRIPT } from "@/lib/editor-inject"
import { SectionLibrary } from "@/components/build/section-library"
import { TemplateBrowser } from "@/components/build/template-browser"
import { UpgradeBanner } from "@/components/build/upgrade-banner"
import { BlogPanel } from "@/components/build/blog-panel"
import { scopeSectionCss, wrapSectionHtml, getScopeClass } from "@/lib/section-css"
import type { BusinessDetails } from "@/lib/onboarding"
import type { SectionTemplate } from "@/types"

interface SelectedElement {
  editKey: string
  content: string
  tagName: string
  s9Type: "text" | "image" | "link" | "section"
  href?: string
  rect?: { width: number; height: number }
}

type Viewport = "desktop" | "tablet" | "mobile"
const VIEWPORT_WIDTHS: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "375px" }

export function Builder({
  initialDetails,
  ownerName,
  host,
  initialHtml,
  subscribed = false,
}: {
  initialDetails: BusinessDetails
  ownerName: string
  host: string
  initialHtml?: string
  subscribed?: boolean
}) {
  const [prompt, setPrompt] = useState("")
  const [rawHtml, setRawHtml] = useState(initialHtml ?? "")
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState("")
  const [selectedEl, setSelectedEl] = useState<SelectedElement | null>(null)
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [showSectionLib, setShowSectionLib] = useState(false)
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false)
  const [showBlogPanel, setShowBlogPanel] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const htmlResolveRef = useRef<((h: string) => void) | null>(null)
  const promptRef = useRef<HTMLInputElement>(null)

  const hasContent = rawHtml.length > 100

  // -- postMessage listener --------------------------------------------------
  const handleMessage = useCallback((e: MessageEvent) => {
    const d = e.data
    if (!d || typeof d.type !== "string" || !d.type.startsWith("s9:")) return
    if (d.type === "s9:select") {
      const s9Type = d.s9Type === "image" ? "image" as const
        : d.s9Type === "link" ? "link" as const
        : d.s9Type === "section" ? "section" as const
        : "text" as const
      setSelectedEl({ editKey: d.editKey, content: d.content, tagName: d.tagName, s9Type, href: d.href || "", rect: d.rect })
    } else if (d.type === "s9:deselect" || d.type === "s9:deleted") {
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

  // -- Build srcDoc ----------------------------------------------------------
  function buildSrcDoc(fullHtml: string): string {
    let doc = fullHtml
    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `<style>${EDITOR_OVERLAY_CSS}</style></head>`)
    }
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `<script>${EDITOR_SCRIPT}</script></body>`)
    } else {
      doc += `<script>${EDITOR_SCRIPT}</script>`
    }
    return doc
  }

  // -- AI generate / follow-up ------------------------------------------------
  async function handleGenerate() {
    const text = prompt.trim()
    if (!text) return
    setError("")
    setGenerating(true)
    setSelectedEl(null)
    try {
      const res = await fetch("/api/build/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, currentHtml: hasContent ? rawHtml : undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Generation failed"); return }
      setRawHtml(data.html)
      setPrompt("")
      setPublished(false)
    } catch {
      setError("Could not reach AI. Check your connection.")
    } finally {
      setGenerating(false)
      promptRef.current?.focus()
    }
  }

  // -- Section insert ----------------------------------------------------------
  function handleInsertSection(section: SectionTemplate) {
    const scopeClass = getScopeClass(section.id)
    const wrappedHtml = wrapSectionHtml(section.html, section.id)
    const scopedCss = scopeSectionCss(section.css, scopeClass)
    if (scopedCss) postToIframe({ type: "s9:addCss", css: scopedCss })
    postToIframe({ type: "s9:insertSection", html: wrappedHtml })
    setShowSectionLib(false)
  }

  function handleMoveSection(editKey: string, direction: "up" | "down") {
    postToIframe({ type: "s9:moveSection", editKey, direction })
  }

  // -- Element actions --------------------------------------------------------
  function handleUpdate(editKey: string, content: string) {
    postToIframe({ type: "s9:update", editKey, content })
  }
  function handleUpdateAttr(editKey: string, attr: string, value: string) {
    postToIframe({ type: "s9:updateAttr", editKey, attr, value })
  }
  function handleDelete(editKey: string) {
    postToIframe({ type: "s9:delete", editKey })
  }

  // -- Publish ----------------------------------------------------------------
  async function handlePublish() {
    setError("")
    setPublishing(true)
    await fetch("/api/build/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details: initialDetails }),
    })
    const res = await fetch("/api/build/publish", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "ai", html: rawHtml }),
    })
    setPublishing(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Could not publish"); return }
    setPublished(true)
  }

  const srcDoc = hasContent ? buildSrcDoc(rawHtml) : ""

  // -- Render -----------------------------------------------------------------
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-semibold">Site9 Builder</p>
            <p className="text-xs text-muted-foreground">{ownerName} · {host}</p>
          </div>
        </div>

        {/* Viewport toggle */}
        {hasContent && (
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([vp, Icon]) => (
              <button
                key={vp}
                onClick={() => setViewport(vp)}
                className={`rounded-md p-1.5 transition-colors ${viewport === vp ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                title={vp.charAt(0).toUpperCase() + vp.slice(1)}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowTemplateBrowser(!showTemplateBrowser); if (!showTemplateBrowser) { setShowSectionLib(false); setShowBlogPanel(false) } }}
            className={`rounded-md p-1.5 transition-colors ${showTemplateBrowser ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            title="Browse Templates"
            data-testid="toggle-template-browser"
          >
            <LayoutTemplate className="h-4 w-4" />
          </button>
          {hasContent && (
            <button
              onClick={() => { setShowSectionLib(!showSectionLib); if (!showSectionLib) { setShowTemplateBrowser(false); setShowBlogPanel(false) } }}
              className={`rounded-md p-1.5 transition-colors ${showSectionLib ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              title="Section Library"
              data-testid="toggle-section-lib"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => { setShowBlogPanel(!showBlogPanel); if (!showBlogPanel) { setShowTemplateBrowser(false); setShowSectionLib(false) } }}
            className={`rounded-md p-1.5 transition-colors ${showBlogPanel ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            title="Blog"
            data-testid="toggle-blog-panel"
          >
            <FileText className="h-4 w-4" />
          </button>
          {published && (
            <a href={`https://${host}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline">
              <ExternalLink className="h-3 w-3" /> View live
            </a>
          )}
          <Button size="sm" variant="brand" disabled={!hasContent || publishing} onClick={handlePublish} data-testid="builder-publish">
            {publishing ? "Publishing…" : published ? "Published ✓" : "Publish"} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Soft upsell — never blocks publishing, hidden once subscribed */}
      <UpgradeBanner subscribed={subscribed} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Template browser sidebar */}
        {showTemplateBrowser && (
          <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
            <TemplateBrowser onSelect={(html, css) => {
              const combined = css ? `<style>${css}</style>${html}` : html
              setRawHtml(combined)
              setShowTemplateBrowser(false)
              setSelectedEl(null)
            }} />
          </div>
        )}

        {/* Section library sidebar */}
        {hasContent && showSectionLib && !showTemplateBrowser && (
          <div className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
            <SectionLibrary onInsert={handleInsertSection} />
          </div>
        )}

        {/* Blog panel sidebar */}
        {showBlogPanel && !showTemplateBrowser && !showSectionLib && (
          <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
            <BlogPanel host={host} />
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 flex flex-col items-center bg-muted/30 overflow-auto">
          {!hasContent && !generating ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-lg">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
                  <Wand2 className="h-8 w-8 text-brand" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">What do you want to build?</h1>
                <p className="mt-2 text-muted-foreground">Describe your website and AI will create it instantly.</p>
                <div className="mt-6 space-y-2 text-left">
                  {[
                    `A modern website for ${initialDetails.name || "my business"} with services, about, and contact`,
                    "A photography portfolio with dark theme and full-width gallery",
                    "A restaurant landing page with menu, hours, and reservation CTA",
                    "A SaaS landing page with pricing, features, and testimonials",
                  ].map((s) => (
                    <button key={s} onClick={() => { setPrompt(s); promptRef.current?.focus() }}
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground hover:border-brand/50 hover:text-foreground transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                <p className="text-sm font-medium">{hasContent ? "Updating…" : "Creating your website…"}</p>
                <p className="mt-1 text-xs text-muted-foreground">This usually takes 15–45 seconds</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex justify-center" style={{ padding: viewport !== "desktop" ? "1rem" : 0 }}>
              <iframe
                ref={iframeRef}
                title="Website preview"
                data-testid="builder-preview"
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                className="bg-white transition-all duration-300 h-full"
                style={{
                  width: VIEWPORT_WIDTHS[viewport],
                  maxWidth: "100%",
                  borderRadius: viewport !== "desktop" ? "12px" : 0,
                  boxShadow: viewport !== "desktop" ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
                }}
              />
            </div>
          )}
        </div>

        {/* Right panel */}
        {hasContent && !generating && (
          <div className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-card overflow-y-auto">
            {selectedEl ? (
              <ElementEditor
                key={selectedEl.editKey}
                selected={selectedEl}
                onUpdate={handleUpdate}
                onUpdateAttr={handleUpdateAttr}
                onDelete={handleDelete}
                onMoveSection={handleMoveSection}
                businessName={initialDetails.name ?? ""}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                <MousePointerClick className="h-8 w-8" />
                <p className="text-sm font-medium">Click any element to edit</p>
                <p className="text-xs">Select text, images, links, or sections.<br />Use the prompt bar for bigger changes.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom prompt bar */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        {error && <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate() }} className="mx-auto flex max-w-3xl items-center gap-2">
          <Input ref={promptRef} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder={hasContent ? "Describe changes… e.g. 'add testimonials' or 'use real social media icons'" : "Describe your website…"}
            disabled={generating} className="flex-1" data-testid="builder-prompt" />
          <Button type="submit" disabled={generating || !prompt.trim()} data-testid="builder-send"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Element editor panel
// ---------------------------------------------------------------------------

function ElementEditor({
  selected, onUpdate, onUpdateAttr, onDelete, onMoveSection, businessName,
}: {
  selected: SelectedElement
  onUpdate: (key: string, content: string) => void
  onUpdateAttr: (key: string, attr: string, val: string) => void
  onDelete: (key: string) => void
  onMoveSection: (key: string, direction: "up" | "down") => void
  businessName: string
}) {
  const [editValue, setEditValue] = useState(selected.content)
  const [imageUrl, setImageUrl] = useState(selected.s9Type === "image" ? selected.content : "")
  const [linkHref, setLinkHref] = useState(selected.href ?? "")
  const [aiInstruction, setAiInstruction] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [err, setErr] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const isLink = selected.s9Type === "link" || selected.tagName === "a" || !!selected.href
  const isSection = selected.s9Type === "section"
  const isImage = selected.s9Type === "image"
  const isText = selected.s9Type === "text" || selected.s9Type === "link"

  async function aiRewrite() {
    if (!aiInstruction.trim()) return
    setErr(""); setAiLoading(true)
    try {
      const res = await fetch("/api/build/edit-element", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentContent: editValue, instruction: aiInstruction, businessName }),
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

  const label = selected.tagName + (selected.rect ? ` (${selected.rect.width}×${selected.rect.height})` : "")

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header with tag info + delete */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
          <p className="font-semibold text-sm">{selected.editKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
        </div>
        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(selected.editKey)} title="Delete this element">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {err && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{err}</p>}

      {/* Text editing */}
      {isText && (
        <>
          <Textarea rows={4} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm" />
          <Button size="sm" variant="brand" onClick={() => onUpdate(selected.editKey, editValue)}>Update text</Button>
        </>
      )}

      {/* Link URL */}
      {isLink && (
        <div className="border-t border-border pt-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Link URL</p>
          <div className="flex gap-2">
            <Input placeholder="https://..." value={linkHref} onChange={(e) => setLinkHref(e.target.value)} className="text-sm" />
            <Button size="sm" variant="outline" onClick={() => { if (linkHref.trim()) onUpdateAttr(selected.editKey, "href", linkHref.trim()) }}>Set</Button>
          </div>
        </div>
      )}

      {/* Image */}
      {isImage && (
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
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Or paste URL</p>
            <div className="flex gap-2">
              <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="text-sm" />
              <Button size="sm" variant="outline" onClick={() => { if (imageUrl.trim()) onUpdateAttr(selected.editKey, "src", imageUrl.trim()) }}>
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Section info + move controls */}
      {isSection && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">This is a section/container. Click elements inside it to edit them, or delete the whole section.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onMoveSection(selected.editKey, "up")} data-testid="move-section-up">
              <ChevronUp className="h-3.5 w-3.5" /> Move Up
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onMoveSection(selected.editKey, "down")} data-testid="move-section-down">
              <ChevronDown className="h-3.5 w-3.5" /> Move Down
            </Button>
          </div>
        </div>
      )}

      {/* AI Rewrite — for all types */}
      <div className="border-t border-border pt-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">AI Edit</p>
        <Input placeholder="e.g. Make it shorter, add phone number..." value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} onKeyDown={(e) => e.key === "Enter" && aiRewrite()} className="text-sm" />
        <Button size="sm" variant="outline" className="mt-2 w-full" loading={aiLoading} disabled={!aiInstruction.trim()} onClick={aiRewrite}>
          <Wand2 className="h-3.5 w-3.5" /> Rewrite with AI
        </Button>
      </div>
    </div>
  )
}
