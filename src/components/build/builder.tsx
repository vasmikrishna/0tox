"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRight, ArrowLeft, Check, Copy, LayoutTemplate, Sparkles, ExternalLink, PartyPopper,
} from "lucide-react"
import { BUSINESS_TEMPLATES } from "@/lib/business-templates"
import { buildAiWebsitePrompt } from "@/lib/ai-website-prompt"
import type { BusinessDetails } from "@/lib/onboarding"

type Step = "details" | "choose" | "template" | "ai" | "done"

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

  const [selected, setSelected] = useState<string>(BUSINESS_TEMPLATES[0].key)
  const [aiHtml, setAiHtml] = useState("")
  const [copied, setCopied] = useState(false)

  function set<K extends keyof BusinessDetails>(key: K, value: BusinessDetails[K]) {
    setDetails(d => ({ ...d, [key]: value }))
  }

  const withServices = (): BusinessDetails => ({
    ...details,
    services: servicesText.split("\n").map(s => s.trim()).filter(Boolean),
  })

  const aiPrompt = useMemo(() => buildAiWebsitePrompt(withServices()), [details, servicesText]) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function publish(mode: "template" | "ai") {
    setError("")
    setBusy(true)
    const body = mode === "template"
      ? { mode, templateKey: selected }
      : { mode, html: aiHtml }
    const res = await fetch("/api/build/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Could not publish")
      return
    }
    setStep("done")
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(aiPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy — select the text and copy manually")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <p className="text-sm text-muted-foreground">Welcome, {ownerName}</p>
        <h1 className="text-2xl font-bold tracking-tight">Build your website</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your site will be live at <span className="font-medium text-foreground">{host}</span>
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive" data-testid="build-error">
          {error}
        </p>
      )}

      {step === "details" && (
        <section className="space-y-5" data-testid="build-details">
          <Field label="Business name" required>
            <Input data-testid="bd-name" value={details.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="Sunrise Cafe" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tagline">
              <Input data-testid="bd-tagline" value={details.tagline ?? ""} onChange={e => set("tagline", e.target.value)} placeholder="Freshly brewed, every morning" />
            </Field>
            <Field label="Type of business">
              <Input data-testid="bd-category" value={details.category ?? ""} onChange={e => set("category", e.target.value)} placeholder="Cafe, Salon, Studio…" />
            </Field>
          </div>
          <Field label="About your business">
            <Textarea data-testid="bd-about" rows={3} value={details.about ?? ""} onChange={e => set("about", e.target.value)} placeholder="Tell visitors what you do and what makes you special." />
          </Field>
          <Field label="Services or offerings" hint="One per line">
            <Textarea data-testid="bd-services" rows={3} value={servicesText} onChange={e => setServicesText(e.target.value)} placeholder={"Espresso & coffee\nFresh pastries\nBreakfast all day"} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address">
              <Input data-testid="bd-address" value={details.address ?? ""} onChange={e => set("address", e.target.value)} placeholder="12 Market St, Bengaluru" />
            </Field>
            <Field label="Opening hours">
              <Input data-testid="bd-hours" value={details.hours ?? ""} onChange={e => set("hours", e.target.value)} placeholder="Mon–Sat, 8am–8pm" />
            </Field>
            <Field label="Phone">
              <Input data-testid="bd-phone" value={details.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="WhatsApp" hint="For the chat button">
              <Input data-testid="bd-whatsapp" value={details.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email">
              <Input data-testid="bd-email" type="email" value={details.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="hello@yourbusiness.com" />
            </Field>
          </div>

          <Button
            variant="brand"
            className="w-full"
            loading={busy}
            data-testid="build-details-next"
            onClick={async () => { if (await saveDetails()) setStep("choose") }}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      {step === "choose" && (
        <section className="space-y-4" data-testid="build-choose">
          <h2 className="text-center text-lg font-semibold">How do you want to build it?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              data-testid="choose-template"
              onClick={() => setStep("template")}
              className="rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-brand hover:bg-accent"
            >
              <LayoutTemplate className="mb-3 h-7 w-7 text-brand" />
              <h3 className="font-semibold">Pick a template</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a ready-made design and we&apos;ll fill it with your details. Fastest way to go live.</p>
            </button>
            <button
              type="button"
              data-testid="choose-ai"
              onClick={() => setStep("ai")}
              className="rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-brand hover:bg-accent"
            >
              <Sparkles className="mb-3 h-7 w-7 text-brand" />
              <h3 className="font-semibold">Build with AI</h3>
              <p className="mt-1 text-sm text-muted-foreground">Copy a ready-made prompt into ChatGPT or Claude, then paste the result back here.</p>
            </button>
          </div>
          <BackButton onClick={() => setStep("details")} />
        </section>
      )}

      {step === "template" && (
        <section className="space-y-5" data-testid="build-template">
          <h2 className="text-center text-lg font-semibold">Choose a design</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {BUSINESS_TEMPLATES.map(tpl => {
              const isOn = selected === tpl.key
              return (
                <button
                  key={tpl.key}
                  type="button"
                  data-testid={`template-${tpl.key}`}
                  onClick={() => setSelected(tpl.key)}
                  className={`overflow-hidden rounded-xl border text-left transition-all ${isOn ? "border-brand ring-2 ring-brand/40" : "border-border hover:border-brand/60"}`}
                >
                  <div className="relative aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tpl.preview} alt={tpl.name} className="h-full w-full object-cover" />
                    {isOn && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-background">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{tpl.industry}</p>
                    <h3 className="font-semibold">{tpl.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tpl.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep("choose")} />
            <Button variant="brand" loading={busy} data-testid="publish-template" onClick={() => publish("template")}>
              Publish my website <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {step === "ai" && (
        <section className="space-y-5" data-testid="build-ai">
          <h2 className="text-center text-lg font-semibold">Build with AI</h2>
          <ol className="space-y-4">
            <li className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">1. Copy this prompt</p>
                <Button size="sm" variant="outline" data-testid="ai-copy" onClick={copyPrompt}>
                  {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
                </Button>
              </div>
              <Textarea readOnly rows={6} value={aiPrompt} className="font-mono text-xs" data-testid="ai-prompt" />
              <p className="mt-2 text-xs text-muted-foreground">
                Paste it into <strong>ChatGPT</strong>, <strong>Claude</strong>, or any AI chat, and it will generate your website.
              </p>
            </li>
            <li className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-medium">2. Paste the HTML it gave you</p>
              <Textarea
                rows={8}
                value={aiHtml}
                onChange={e => setAiHtml(e.target.value)}
                placeholder="<!DOCTYPE html> … paste the full result here"
                className="font-mono text-xs"
                data-testid="ai-html"
              />
            </li>
          </ol>
          <div className="flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep("choose")} />
            <Button variant="brand" loading={busy} disabled={aiHtml.trim().length < 40} data-testid="publish-ai" onClick={() => publish("ai")}>
              Publish my website <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

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
