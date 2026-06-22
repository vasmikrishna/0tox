"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, ExternalLink, PartyPopper } from "lucide-react"
import { CURATED_TEMPLATES } from "@/lib/curated-templates"
import { buildEditorSrcDoc } from "@/lib/editor-inject"
import { CategoryPicker } from "@/components/build/category-picker"
import { TemplateGallery } from "@/components/build/template-gallery"
import { EditorPanel, type SelectedElement } from "@/components/build/editor-panel"
import type { BusinessDetails } from "@/lib/onboarding"

type Step = "details" | "category" | "template" | "generating" | "editor" | "done"

export function Builder({
  initialDetails,
  ownerName,
  host,
}: {
  initialDetails: BusinessDetails
  ownerName: string
  host: string
}) {
  const [step, setStep] = useState<Step>("details")
  const [details, setDetails] = useState<BusinessDetails>(initialDetails)
  const [servicesText, setServicesText] = useState((initialDetails.services ?? []).join("\n"))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const [category, setCategory] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState(CURATED_TEMPLATES[0].key)
  const [editorHtml, setEditorHtml] = useState("")
  const [editorCss, setEditorCss] = useState("")
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const htmlResolveRef = useRef<((html: string) => void) | null>(null)

  function set<K extends keyof BusinessDetails>(key: K, value: BusinessDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }))
  }

  const withServices = (): BusinessDetails => ({
    ...details,
    services: servicesText.split("\n").map((s) => s.trim()).filter(Boolean),
  })

  // -- postMessage listener for iframe editor --------------------------------

  const handleMessage = useCallback((e: MessageEvent) => {
    const d = e.data
    if (!d || typeof d.type !== "string" || !d.type.startsWith("s9:")) return

    if (d.type === "s9:select") {
      setSelectedElement({
        editKey: d.editKey,
        content: d.content,
        tagName: d.tagName,
        s9Type: d.s9Type === "image" ? "image" : "text",
      })
    } else if (d.type === "s9:deselect") {
      setSelectedElement(null)
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

  function handleEditorUpdate(editKey: string, content: string) {
    postToIframe({ type: "s9:update", editKey, content })
  }

  function handleEditorUpdateAttr(editKey: string, attr: string, value: string) {
    postToIframe({ type: "s9:updateAttr", editKey, attr, value })
  }

  // -- Save business details --------------------------------------------------

  async function saveDetails() {
    setError("")
    if (!details.name?.trim()) { setError("Business name is required"); return false }
    setBusy(true)
    const res = await fetch("/api/build/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details: withServices() }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Could not save")
      return false
    }
    return true
  }

  // -- Generate template content with AI --------------------------------------

  async function generateTemplate() {
    setError("")
    setStep("generating")
    try {
      const res = await fetch("/api/build/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedTemplate,
          category,
          details: withServices(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Could not generate your website")
        setStep("template")
        return
      }
      setEditorHtml(data.html)
      setEditorCss(data.css)
      setSelectedElement(null)
      setStep("editor")
    } catch {
      setError("Could not reach the AI. Check your connection and try again.")
      setStep("template")
    }
  }

  // -- Publish ----------------------------------------------------------------

  async function publish() {
    setError("")
    setBusy(true)

    let finalHtml = editorHtml
    // Ask iframe for the current HTML (captures all visual edits)
    if (iframeRef.current?.contentWindow) {
      try {
        const html = await new Promise<string>((resolve) => {
          htmlResolveRef.current = resolve
          postToIframe({ type: "s9:getHtml" })
          setTimeout(() => {
            if (htmlResolveRef.current) {
              htmlResolveRef.current = null
              resolve(editorHtml)
            }
          }, 2000)
        })
        finalHtml = html
      } catch {
        // fall back to editorHtml
      }
    }

    const res = await fetch("/api/build/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "curated",
        html: finalHtml,
        css: editorCss,
        templateKey: selectedTemplate,
      }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Could not publish")
      return
    }
    setStep("done")
  }

  // -- Render -----------------------------------------------------------------

  const isEditor = step === "editor"
  const containerClass = isEditor
    ? "mx-auto max-w-7xl px-4 py-6"
    : "mx-auto max-w-3xl px-4 py-10"

  return (
    <div className={containerClass}>
      {!isEditor && (
        <header className="mb-8 text-center">
          <p className="text-sm text-muted-foreground">Welcome, {ownerName}</p>
          <h1 className="text-2xl font-bold tracking-tight">Build your website</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your site will be live at <span className="font-medium text-foreground">{host}</span>
          </p>
        </header>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive" data-testid="build-error">
          {error}
        </p>
      )}

      {/* Step 1: Business details */}
      {step === "details" && (
        <section className="space-y-5" data-testid="build-details">
          <Field label="Business name" required>
            <Input data-testid="bd-name" value={details.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Sunrise Cafe" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tagline">
              <Input data-testid="bd-tagline" value={details.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="Freshly brewed, every morning" />
            </Field>
            <Field label="Type of business">
              <Input data-testid="bd-category" value={details.category ?? ""} onChange={(e) => set("category", e.target.value)} placeholder="Cafe, Salon, Studio…" />
            </Field>
          </div>
          <Field label="About your business">
            <Textarea data-testid="bd-about" rows={3} value={details.about ?? ""} onChange={(e) => set("about", e.target.value)} placeholder="Tell visitors what you do and what makes you special." />
          </Field>
          <Field label="Services or offerings" hint="One per line">
            <Textarea data-testid="bd-services" rows={3} value={servicesText} onChange={(e) => setServicesText(e.target.value)} placeholder={"Espresso & coffee\nFresh pastries\nBreakfast all day"} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address">
              <Input data-testid="bd-address" value={details.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="12 Market St, Bengaluru" />
            </Field>
            <Field label="Opening hours">
              <Input data-testid="bd-hours" value={details.hours ?? ""} onChange={(e) => set("hours", e.target.value)} placeholder="Mon–Sat, 8am–8pm" />
            </Field>
            <Field label="Phone">
              <Input data-testid="bd-phone" value={details.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="WhatsApp" hint="For the chat button">
              <Input data-testid="bd-whatsapp" value={details.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email">
              <Input data-testid="bd-email" type="email" value={details.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="hello@yourbusiness.com" />
            </Field>
          </div>
          <Button variant="brand" className="w-full" loading={busy} data-testid="build-details-next" onClick={async () => { if (await saveDetails()) setStep("category") }}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      {/* Step 2: Category selection */}
      {step === "category" && (
        <section className="space-y-4">
          <CategoryPicker onSelect={(cat) => { setCategory(cat); setStep("template") }} />
          <BackButton onClick={() => setStep("details")} />
        </section>
      )}

      {/* Step 3: Template selection */}
      {step === "template" && (
        <section className="space-y-5">
          <TemplateGallery selected={selectedTemplate} onSelect={setSelectedTemplate} />
          <div className="flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep("category")} />
            <Button variant="brand" data-testid="build-generate" onClick={generateTemplate}>
              Generate my website <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 4: Generating (transient) */}
      {step === "generating" && (
        <section className="space-y-4 text-center" data-testid="build-generating">
          <div className="rounded-xl border border-border bg-card p-10">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
            <p className="text-sm font-medium">Generating your website…</p>
            <p className="mt-1 text-xs text-muted-foreground">Filling in your content. This usually takes 10–20 seconds.</p>
          </div>
        </section>
      )}

      {/* Step 5: Visual editor */}
      {step === "editor" && (
        <section data-testid="build-editor">
          <div className="mb-4 flex items-center justify-between">
            <BackButton onClick={() => setStep("template")} />
            <h2 className="text-lg font-semibold">Edit your website</h2>
            <Button variant="brand" loading={busy} data-testid="publish-curated" onClick={publish}>
              Publish <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 overflow-hidden rounded-xl border border-border">
              <iframe
                ref={iframeRef}
                title="Website editor"
                data-testid="editor-preview"
                srcDoc={buildEditorSrcDoc(editorHtml, editorCss)}
                className="h-[600px] w-full bg-white"
                sandbox="allow-scripts"
              />
            </div>
            <div className="w-full shrink-0 rounded-xl border border-border bg-card lg:w-80">
              <EditorPanel
                selected={selectedElement}
                onUpdate={handleEditorUpdate}
                onUpdateAttr={handleEditorUpdateAttr}
                businessName={details.name ?? ""}
              />
            </div>
          </div>
        </section>
      )}

      {/* Step 6: Done */}
      {step === "done" && (
        <section className="space-y-6 text-center" data-testid="build-done">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
            <PartyPopper className="h-7 w-7 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Your website is live!</h2>
            <p className="mt-1 text-sm text-muted-foreground">It&apos;s published and your portal is now unlocked.</p>
          </div>
          <a
            href={`https://${host}`}
            target="_blank"
            rel="noopener"
            data-testid="done-view-site"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            View my site at {host} <ExternalLink className="h-4 w-4" />
          </a>
          <Button asChild variant="brand" className="w-full" data-testid="done-dashboard">
            <a href="/client/dashboard">Go to my dashboard <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </section>
      )}
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
        {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="build-back">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  )
}
