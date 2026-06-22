"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight, Send, Wand2, Upload, ImageIcon, MousePointerClick,
  ExternalLink, Sparkles,
} from "lucide-react"
import { buildEditorSrcDoc } from "@/lib/editor-inject"
import { splitAiHtml } from "@/lib/ai-website-prompt"
import type { BusinessDetails } from "@/lib/onboarding"

interface SelectedElement {
  editKey: string
  content: string
  tagName: string
  s9Type: "text" | "image"
}

export function Builder({
  initialDetails,
  ownerName,
  host,
}: {
  initialDetails: BusinessDetails
  ownerName: string
  host: string
}) {
  const [prompt, setPrompt] = useState("")
  const [siteHtml, setSiteHtml] = useState("")
  const [siteCss, setSiteCss] = useState("")
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState("")
  const [selectedEl, setSelectedEl] = useState<SelectedElement | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const htmlResolveRef = useRef<((h: string) => void) | null>(null)
  const promptRef = useRef<HTMLInputElement>(null)

  const hasContent = siteHtml.length > 100
  const hasEditMarkers = siteHtml.includes("data-s9-edit")

  // -- postMessage listener --------------------------------------------------
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

  async function getIframeHtml(): Promise<string> {
    if (!hasEditMarkers || !iframeRef.current?.contentWindow) return siteHtml
    return new Promise<string>((resolve) => {
      htmlResolveRef.current = resolve
      postToIframe({ type: "s9:getHtml" })
      setTimeout(() => { if (htmlResolveRef.current) { htmlResolveRef.current = null; resolve(siteHtml) } }, 2000)
    })
  }

  // -- AI generate / follow-up ------------------------------------------------
  async function handleGenerate() {
    const text = prompt.trim()
    if (!text) return
    setError("")
    setGenerating(true)
    setSelectedEl(null)

    try {
      const currentHtml = hasContent ? await getIframeHtml() : undefined
      const res = await fetch("/api/build/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, currentHtml }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Generation failed"); return }

      setSiteHtml(data.html)
      const split = splitAiHtml(data.html)
      setSiteCss(split.css)
      setPrompt("")
      setPublished(false)
    } catch {
      setError("Could not reach AI. Check your connection.")
    } finally {
      setGenerating(false)
      promptRef.current?.focus()
    }
  }

  // -- Element editing --------------------------------------------------------
  function handleElementUpdate(editKey: string, content: string) {
    postToIframe({ type: "s9:update", editKey, content })
  }

  function handleElementAttr(editKey: string, attr: string, value: string) {
    postToIframe({ type: "s9:updateAttr", editKey, attr, value })
  }

  // -- Publish ----------------------------------------------------------------
  async function handlePublish() {
    setError("")
    setPublishing(true)

    const finalHtml = await getIframeHtml()
    const split = splitAiHtml(finalHtml.includes("<!") ? finalHtml : siteHtml)

    // Save business details first
    await fetch("/api/build/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details: initialDetails }),
    })

    const res = await fetch("/api/build/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "ai", html: finalHtml.includes("<!") ? finalHtml : siteHtml }),
    })
    setPublishing(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Could not publish")
      return
    }
    setPublished(true)
    setSiteHtml(split.html)
    setSiteCss(split.css)
  }

  // -- Build the iframe srcDoc ------------------------------------------------
  const srcDoc = hasEditMarkers
    ? buildEditorSrcDoc(
        siteHtml.includes("<body") ? siteHtml.replace(/[\s\S]*?<body[^>]*>/i, "").replace(/<\/body>[\s\S]*/i, "") : siteHtml,
        siteCss,
      )
    : siteHtml

  // -- Render -----------------------------------------------------------------
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-semibold">Site9 Builder</p>
            <p className="text-xs text-muted-foreground">{ownerName} · {host}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {published && (
            <a href={`https://${host}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline">
              <ExternalLink className="h-3 w-3" /> View live site
            </a>
          )}
          <Button
            size="sm"
            variant="brand"
            disabled={!hasContent || publishing}
            onClick={handlePublish}
            data-testid="builder-publish"
          >
            {publishing ? "Publishing…" : published ? "Published ✓" : "Publish"} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview */}
        <div className="flex-1 flex flex-col">
          {!hasContent && !generating ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-lg">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
                  <Wand2 className="h-8 w-8 text-brand" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">What do you want to build?</h1>
                <p className="mt-2 text-muted-foreground">
                  Describe your website and AI will create it instantly. You can refine it with follow-up prompts.
                </p>
                <div className="mt-6 space-y-2 text-left">
                  {[
                    `A modern website for ${initialDetails.name || "my business"} — a ${initialDetails.category || "local business"} with services, about section, and contact info`,
                    "A photography portfolio with a dark theme, full-width gallery, and contact form",
                    "A restaurant landing page with menu highlights, opening hours, and reservation CTA",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setPrompt(suggestion); promptRef.current?.focus() }}
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground hover:border-brand/50 hover:text-foreground transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                <p className="text-sm font-medium">{hasContent ? "Updating your website…" : "Creating your website…"}</p>
                <p className="mt-1 text-xs text-muted-foreground">This usually takes 10–30 seconds</p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              title="Website preview"
              data-testid="builder-preview"
              srcDoc={srcDoc}
              className="flex-1 w-full bg-white"
              sandbox={hasEditMarkers ? "allow-scripts" : ""}
            />
          )}
        </div>

        {/* Right panel — only when there's content */}
        {hasContent && !generating && (
          <div className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-card">
            {selectedEl ? (
              <ElementEditor
                key={selectedEl.editKey}
                selected={selectedEl}
                onUpdate={handleElementUpdate}
                onUpdateAttr={handleElementAttr}
                businessName={initialDetails.name ?? ""}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                <MousePointerClick className="h-8 w-8" />
                <p className="text-sm">Click any element to edit it</p>
                <p className="text-xs">Or type a follow-up prompt below</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom prompt bar */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        {error && (
          <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">{error}</p>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); handleGenerate() }}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <Input
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={hasContent ? "Describe changes… e.g. 'make the hero darker' or 'add a testimonials section'" : "Describe your website… e.g. 'A modern cafe website with menu and contact'"}
            disabled={generating}
            className="flex-1"
            data-testid="builder-prompt"
          />
          <Button type="submit" disabled={generating || !prompt.trim()} data-testid="builder-send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Element editor panel (inline, not a separate file)
// ---------------------------------------------------------------------------

function ElementEditor({
  selected,
  onUpdate,
  onUpdateAttr,
  businessName,
}: {
  selected: SelectedElement
  onUpdate: (key: string, content: string) => void
  onUpdateAttr: (key: string, attr: string, val: string) => void
  businessName: string
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

  const zoneName = selected.editKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Editing</p>
        <p className="font-semibold text-sm">{zoneName}</p>
      </div>
      {err && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{err}</p>}

      {selected.s9Type === "text" && (
        <>
          <Textarea rows={4} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm" />
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
