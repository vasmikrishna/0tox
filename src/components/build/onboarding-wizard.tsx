"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, ArrowRight, Check, Upload, Wand2, Sparkles,
  Globe, Palette, ImageIcon, Building2, Eye, Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CATEGORIES } from "@/lib/curated-templates"
import { extractColorsFromImage } from "@/lib/color-extract"
import { LOGO_STYLES } from "@/lib/logo-styles"
import type { BusinessDetails } from "@/lib/onboarding"
import type { BrandAsset } from "@/lib/build-assets"
import type { ReferenceSite, ColorPalette, ColorPaletteColors } from "@/types"

/** A freshly generated, not-yet-chosen logo option. */
interface LogoOption { url: string; svg: string; style?: string }

type WizardStep = 1 | 2 | 3 | 4 | 5

const STEP_LABELS = [
  "Choose a Style",
  "Your Logo",
  "Pick Colors",
  "Business Details",
  "Generate",
]

const DEFAULT_COLORS: ColorPaletteColors = {
  primary: "#1B3A6B",
  secondary: "#E8F0FE",
  accent: "#FF6B35",
  background: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#6B7280",
}

interface OnboardingWizardProps {
  initialDetails: BusinessDetails
  onComplete: (html: string) => void
}

export function OnboardingWizard({ initialDetails, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)

  // Step 1: Reference site
  const [referenceSites, setReferenceSites] = useState<ReferenceSite[]>([])
  const [selectedRef, setSelectedRef] = useState<string | null>(initialDetails.reference_site_id ?? null)
  const [previewSite, setPreviewSite] = useState<ReferenceSite | null>(null)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [industryFilter, setIndustryFilter] = useState<string>("all")

  // Step 2: Logo
  const [logoUrl, setLogoUrl] = useState(initialDetails.logo_url ?? "")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [generatingLogo, setGeneratingLogo] = useState(false)
  const [logoStyle, setLogoStyle] = useState<string>(LOGO_STYLES[0]?.id ?? "")
  const [logoOptions, setLogoOptions] = useState<LogoOption[]>([])
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 3: Colors
  const [palettes, setPalettes] = useState<ColorPalette[]>([])
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(initialDetails.color_palette_id ?? null)
  const [customColors, setCustomColors] = useState<ColorPaletteColors>(initialDetails.custom_colors ?? DEFAULT_COLORS)
  const [loadingPalettes, setLoadingPalettes] = useState(false)
  const [extractingColors, setExtractingColors] = useState(false)

  // Step 4: Business details
  const [name, setName] = useState(initialDetails.name ?? "")
  const [tagline, setTagline] = useState(initialDetails.tagline ?? "")
  const [about, setAbout] = useState(initialDetails.about ?? "")
  const [category, setCategory] = useState(initialDetails.category ?? "")
  const [phone, setPhone] = useState(initialDetails.phone ?? "")
  const [email, setEmail] = useState(initialDetails.email ?? "")
  const [address, setAddress] = useState(initialDetails.address ?? "")
  const [servicesText, setServicesText] = useState(initialDetails.services?.join(", ") ?? "")

  // Step 5: Generate
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchReferenceSites = useCallback(async () => {
    if (referenceSites.length > 0) return
    setLoadingRefs(true)
    try {
      const res = await fetch("/api/build/reference-sites")
      const data = await res.json()
      setReferenceSites(data.sites ?? [])
    } catch { /* ignore */ }
    finally { setLoadingRefs(false) }
  }, [referenceSites.length])

  const fetchPalettes = useCallback(async () => {
    if (palettes.length > 0) return
    setLoadingPalettes(true)
    try {
      const res = await fetch(`/api/build/palettes${category ? `?industry=${category}` : ""}`)
      const data = await res.json()
      setPalettes(data.palettes ?? [])
    } catch { /* ignore */ }
    finally { setLoadingPalettes(false) }
  }, [palettes.length, category])

  const fetchBrandAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/build/assets")
      const data = await res.json()
      setBrandAssets(data.assets ?? [])
    } catch { /* ignore */ }
  }, [])

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => { fetchReferenceSites() }, [fetchReferenceSites])
  useEffect(() => { fetchBrandAssets() }, [fetchBrandAssets])

  // ── Step navigation ──────────────────────────────────────────────────────

  async function goToStep(next: WizardStep) {
    await saveProgress()
    if (next === 1) fetchReferenceSites()
    if (next === 3) {
      fetchPalettes()
      if (logoUrl && !extractingColors) {
        setExtractingColors(true)
        try {
          const extracted = await extractColorsFromImage(logoUrl)
          setCustomColors(extracted)
        } catch { /* use defaults */ }
        finally { setExtractingColors(false) }
      }
    }
    setStep(next)
  }

  async function saveProgress() {
    const details: Partial<BusinessDetails> = {
      name,
      tagline: tagline || undefined,
      about: about || undefined,
      category: category || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      services: servicesText ? servicesText.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      reference_site_id: selectedRef ?? undefined,
      color_palette_id: selectedPaletteId ?? undefined,
      custom_colors: customColors,
      logo_url: logoUrl || undefined,
    }
    try {
      await fetch("/api/build/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details }),
      })
    } catch { /* non-critical */ }
  }

  // ── Logo upload ──────────────────────────────────────────────────────────

  // Persist a chosen/uploaded logo into the owner's brand asset library so it
  // can be reused later. Best-effort — failure shouldn't block the wizard.
  async function saveToBrandAssets(url: string, style?: string) {
    try {
      const res = await fetch("/api/build/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, style }),
      })
      const data = await res.json()
      if (res.ok && data.assets) setBrandAssets(data.assets)
    } catch { /* non-critical */ }
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/build/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Upload failed"); return }
      setLogoUrl(data.url)
      setLogoOptions([])
      await saveToBrandAssets(data.url)
    } catch { setError("Upload failed") }
    finally { setUploadingLogo(false) }
  }

  // Generate a few options in the selected style; the owner picks one.
  async function handleGenerateLogo() {
    setGeneratingLogo(true)
    setError("")
    setLogoOptions([])
    try {
      const res = await fetch("/api/build/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: name || initialDetails.name,
          category,
          colors: { primary: customColors.primary, accent: customColors.accent },
          style: logoStyle,
          count: 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Logo generation failed"); return }
      setLogoOptions(data.options ?? [])
    } catch { setError("Could not generate logo") }
    finally { setGeneratingLogo(false) }
  }

  // Owner picks one of the generated options.
  async function pickLogoOption(opt: LogoOption) {
    setLogoUrl(opt.url)
    setLogoOptions([])
    await saveToBrandAssets(opt.url, opt.style)
  }

  // Reuse a previously saved brand asset.
  function reuseBrandAsset(asset: BrandAsset) {
    setLogoUrl(asset.url)
    setLogoOptions([])
  }

  async function deleteBrandAsset(id: string) {
    setBrandAssets(prev => prev.filter(a => a.id !== id))
    try {
      await fetch("/api/build/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    } catch { fetchBrandAssets() }
  }

  // ── Final generation ─────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true)
    setError("")
    await saveProgress()

    let referenceHtml: string | undefined
    if (selectedRef) {
      const site = referenceSites.find((s) => s.id === selectedRef)
      if (site) referenceHtml = site.html
    }

    const services = servicesText ? servicesText.split(",").map((s) => s.trim()).filter(Boolean) : []
    const prompt = `Create a modern website for ${name || "my business"}${tagline ? ` — ${tagline}` : ""}. ${about ? `About: ${about}. ` : ""}${category ? `Industry: ${category}. ` : ""}${services.length ? `Services: ${services.join(", ")}. ` : ""}${phone ? `Phone: ${phone}. ` : ""}${email ? `Email: ${email}. ` : ""}${address ? `Address: ${address}. ` : ""}Include all sections: hero, about, services, contact form, and footer.`

    try {
      const res = await fetch("/api/build/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          referenceHtml,
          colorPalette: customColors,
          logoUrl: logoUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Generation failed"); setGenerating(false); return }
      onComplete(data.html)
    } catch {
      setError("Could not reach AI. Check your connection.")
      setGenerating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Industry filter options for Step 1 (built from whatever the API returned).
  const industryOptions = (() => {
    const counts = new Map<string, number>()
    for (const s of referenceSites) {
      const key = (s.industry || "general").toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }))
  })()

  const visibleSites =
    industryFilter === "all"
      ? referenceSites
      : referenceSites.filter((s) => (s.industry || "general").toLowerCase() === industryFilter)

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Progress header */}
      <header className="shrink-0 border-b border-border px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <span className="font-semibold">Site9 Builder</span>
            </div>
            <span className="text-sm text-muted-foreground">Step {step} of 5</span>
          </div>
          <div className="flex gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i + 1 <= step ? "bg-brand" : "bg-muted"
                  }`}
                />
                <p className={`mt-1 text-[10px] ${i + 1 === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Step 1: Reference Sites */}
          {step === 1 && (
            <div className="space-y-6" data-testid="wizard-step-1">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Choose a style you like</h1>
                <p className="mt-1 text-muted-foreground">
                  Browse our full library of website templates. Pick any one you like — we&apos;ll match its look and feel.
                </p>
              </div>
              {loadingRefs ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                </div>
              ) : referenceSites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-10 w-10 mx-auto mb-3" />
                  <p>No templates available yet.</p>
                  <p className="text-sm mt-1">You can skip this step and let AI choose a style.</p>
                </div>
              ) : (
                <>
                  {/* Industry filter — keeps the full template library browsable */}
                  {industryOptions.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2" data-testid="ref-industry-filter">
                      <button
                        type="button"
                        onClick={() => setIndustryFilter("all")}
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                          industryFilter === "all"
                            ? "border-brand bg-brand text-background"
                            : "border-border text-muted-foreground hover:border-brand/60 hover:text-foreground"
                        }`}
                        data-testid="ref-industry-all"
                      >
                        All ({referenceSites.length})
                      </button>
                      {industryOptions.map(({ value, count }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setIndustryFilter(value)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                            industryFilter === value
                              ? "border-brand bg-brand text-background"
                              : "border-border text-muted-foreground hover:border-brand/60 hover:text-foreground"
                          }`}
                          data-testid={`ref-industry-${value}`}
                        >
                          {value} ({count})
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                  {visibleSites.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => setSelectedRef(selectedRef === site.id ? null : site.id)}
                      className={`overflow-hidden rounded-xl border text-left transition-all ${
                        selectedRef === site.id
                          ? "border-brand ring-2 ring-brand/40"
                          : "border-border hover:border-brand/60"
                      }`}
                      data-testid={`ref-site-${site.id}`}
                    >
                      <div className="relative aspect-video bg-white overflow-hidden">
                        {/* Gallery templates ship a screenshot — render it as a lightweight image so
                            the library can show 100+ items without mounting that many live iframes.
                            Curated reference sites keep their live (scaled) preview. */}
                        {site.source === "gallery" && site.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={site.thumbnail_url}
                            alt={site.name}
                            loading="lazy"
                            className="h-full w-full object-cover object-top"
                            data-testid={`ref-preview-${site.id}`}
                          />
                        ) : site.html ? (
                          <div className="absolute inset-0">
                            <iframe
                              title={site.name}
                              srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1280"><style>body{margin:0;font-family:system-ui,sans-serif;overflow:hidden;}${site.css ?? ""}</style></head><body>${site.html}</body></html>`}
                              sandbox=""
                              className="pointer-events-none absolute top-0 left-0 border-0"
                              style={{ width: "1280px", height: "960px", transform: "scale(0.35)", transformOrigin: "top left" }}
                              data-testid={`ref-preview-${site.id}`}
                            />
                          </div>
                        ) : site.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={site.thumbnail_url} alt={site.name} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Globe className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {selectedRef === site.id && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-background">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{site.name}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewSite(site) }}
                            className="text-xs text-brand hover:underline flex items-center gap-1"
                            data-testid={`preview-ref-${site.id}`}
                          >
                            <Eye className="h-3 w-3" /> Preview
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{site.description}</p>
                      </div>
                    </button>
                  ))}
                  </div>
                  {visibleSites.length === 0 && (
                    <p className="text-center py-8 text-sm text-muted-foreground">
                      No templates in this category. Try another filter.
                    </p>
                  )}
                </>
              )}

              {/* Preview dialog */}
              <Dialog open={!!previewSite} onOpenChange={(open) => !open && setPreviewSite(null)}>
                <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 overflow-hidden flex flex-col">
                  <DialogTitle className="shrink-0 px-4 py-3 border-b text-sm font-semibold">
                    {previewSite?.name}
                  </DialogTitle>
                  {previewSite && (
                    <iframe
                      title="Reference site preview"
                      srcDoc={previewSite.html.startsWith("<!") ? previewSite.html : `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui,sans-serif;}${previewSite.css}</style></head><body>${previewSite.html}</body></html>`}
                      sandbox=""
                      className="w-full flex-1 min-h-0 bg-white"
                      data-testid="wizard-ref-preview"
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Step 2: Logo */}
          {step === 2 && (
            <div className="space-y-6 max-w-lg mx-auto" data-testid="wizard-step-2">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Your Logo</h1>
                <p className="mt-1 text-muted-foreground">
                  Pick a style and let AI design a few options — or upload your own.
                </p>
              </div>

              {logoUrl && (
                <div className="flex justify-center">
                  <div className="relative rounded-xl border bg-white p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Your logo" className="max-h-24 max-w-[200px] object-contain" data-testid="selected-logo" />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              )}

              {/* Style picker ------------------------------------------------ */}
              <div>
                <Label className="text-sm font-semibold">Logo style</Label>
                <div className="mt-2 flex flex-wrap gap-2" data-testid="logo-style-picker">
                  {LOGO_STYLES.map((s) => {
                    const active = logoStyle === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setLogoStyle(s.id)}
                        data-testid={`logo-style-${s.id}`}
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors ${active ? "border-brand bg-brand/5 ring-1 ring-brand" : "hover:border-brand/60"}`}
                      >
                        <p className="text-sm font-medium leading-tight">{s.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{s.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleGenerateLogo}
                  disabled={generatingLogo}
                  className="h-11"
                  data-testid="generate-logo-btn"
                >
                  {generatingLogo
                    ? <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Designing…</>
                    : <><Wand2 className="mr-2 h-4 w-4" /> {logoOptions.length || logoUrl ? "Generate new options" : "Generate 2 options"}</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="h-11"
                  data-testid="upload-logo-btn"
                >
                  {uploadingLogo
                    ? <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" /> Uploading…</>
                    : <><Upload className="mr-2 h-4 w-4" /> Upload my logo</>}
                </Button>
              </div>

              {/* Generated options to pick from ------------------------------ */}
              {logoOptions.length > 0 && (
                <div className="space-y-2" data-testid="logo-options">
                  <p className="text-sm font-semibold">Pick the one you like</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {logoOptions.map((opt, i) => (
                      <button
                        key={opt.url}
                        type="button"
                        onClick={() => pickLogoOption(opt)}
                        data-testid={`logo-option-${i}`}
                        className="group flex items-center justify-center rounded-xl border bg-white p-6 transition-colors hover:border-brand hover:ring-1 hover:ring-brand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opt.url} alt={`Logo option ${i + 1}`} className="max-h-20 max-w-full object-contain" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Picking one saves it to your brand assets below.</p>
                </div>
              )}

              {/* Brand asset library — the owner's saved logos --------------- */}
              {brandAssets.length > 0 && (
                <div className="space-y-2" data-testid="brand-assets">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Your brand assets</p>
                    <Badge variant="outline" className="ml-auto">{brandAssets.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {brandAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`relative rounded-lg border bg-white p-3 ${logoUrl === asset.url ? "border-brand ring-1 ring-brand" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => reuseBrandAsset(asset)}
                          title="Use this logo"
                          data-testid={`brand-asset-${asset.id}`}
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset.url} alt="Saved logo" className="h-14 w-14 object-contain" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBrandAsset(asset.id)}
                          title="Delete"
                          data-testid={`brand-asset-delete-${asset.id}`}
                          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
                data-testid="logo-file-input"
              />
            </div>
          )}

          {/* Step 3: Colors */}
          {step === 3 && (
            <div className="space-y-6" data-testid="wizard-step-3">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Pick your colors</h1>
                <p className="mt-1 text-muted-foreground">
                  {logoUrl
                    ? "We extracted colors from your logo. Adjust or pick a palette below."
                    : "Choose a color palette for your website."}
                </p>
              </div>

              {extractingColors && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                </div>
              )}

              {/* Current selection */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold">Your palette</p>
                  <div className="flex gap-1 rounded-lg overflow-hidden">
                    {(["primary", "secondary", "accent", "background", "text", "muted"] as const).map((key) => (
                      <div key={key} className="h-12 flex-1" style={{ backgroundColor: customColors[key] }} title={`${key}: ${customColors[key]}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(["primary", "secondary", "accent", "background", "text", "muted"] as const).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors[key]}
                          onChange={(e) => setCustomColors((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border"
                          data-testid={`wizard-color-${key}`}
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground capitalize">{key}</p>
                          <p className="text-[10px] font-mono">{customColors[key]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Palette presets */}
              {loadingPalettes ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                </div>
              ) : palettes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Or choose a preset</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {palettes.map((palette) => (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => {
                          setSelectedPaletteId(palette.id)
                          setCustomColors(palette.colors)
                        }}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          selectedPaletteId === palette.id
                            ? "border-brand ring-2 ring-brand/40"
                            : "border-border hover:border-brand/60"
                        }`}
                        data-testid={`palette-preset-${palette.id}`}
                      >
                        <p className="text-sm font-medium mb-2">{palette.name}</p>
                        <div className="flex gap-0.5 rounded overflow-hidden">
                          {(["primary", "secondary", "accent", "background", "text", "muted"] as const).map((key) => (
                            <div key={key} className="h-8 flex-1" style={{ backgroundColor: palette.colors[key] }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Business Details */}
          {step === 4 && (
            <div className="space-y-6 max-w-lg mx-auto" data-testid="wizard-step-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Tell us about your business</h1>
                <p className="mt-1 text-muted-foreground">
                  This info will be used to generate your website content.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Business Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Business Name" data-testid="wizard-name" />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short catchy tagline" data-testid="wizard-tagline" />
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategory(cat.key)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                          category === cat.key
                            ? "border-brand bg-brand/5 font-medium"
                            : "border-border hover:border-brand/60"
                        }`}
                        data-testid={`wizard-cat-${cat.key}`}
                      >
                        <span className="mr-1.5">{cat.icon}</span>{cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>About *</Label>
                  <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} placeholder="Tell us about your business..." data-testid="wizard-about" />
                  {!about.trim() && (
                    <p className="mt-1 text-xs text-muted-foreground" data-testid="wizard-about-hint">
                      An About description is required to generate your site.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Services (comma-separated)</Label>
                  <Input value={servicesText} onChange={(e) => setServicesText(e.target.value)} placeholder="Web Design, Branding, Marketing" data-testid="wizard-services" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" data-testid="wizard-phone" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@business.com" data-testid="wizard-email" />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City" data-testid="wizard-address" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Generate */}
          {step === 5 && (
            <div className="space-y-6 max-w-lg mx-auto" data-testid="wizard-step-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Ready to build your website</h1>
                <p className="mt-1 text-muted-foreground">
                  Review your choices and generate your site.
                </p>
              </div>

              <div className="space-y-3">
                {/* Summary cards */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{name || "Unnamed Business"}</span>
                      {category && <Badge variant="outline" className="text-[10px] capitalize">{category}</Badge>}
                    </div>
                    {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
                  </CardContent>
                </Card>

                {selectedRef && (
                  <Card>
                    <CardContent className="p-4 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Style: {referenceSites.find((s) => s.id === selectedRef)?.name ?? "Selected"}</span>
                    </CardContent>
                  </Card>
                )}

                {logoUrl && (
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Logo uploaded</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo" className="h-8 max-w-[80px] object-contain ml-auto" />
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Colors</span>
                    <div className="flex gap-0.5 rounded overflow-hidden ml-auto">
                      {(["primary", "secondary", "accent", "background", "text", "muted"] as const).map((key) => (
                        <div key={key} className="h-6 w-6" style={{ backgroundColor: customColors[key] }} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button
                variant="brand"
                size="lg"
                className="w-full"
                disabled={generating || !name.trim() || !about.trim()}
                onClick={handleGenerate}
                data-testid="wizard-generate-btn"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                    Generating your website…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate My Website
                  </>
                )}
              </Button>
              {generating && (
                <p className="text-xs text-center text-muted-foreground">This usually takes 15–45 seconds</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="shrink-0 border-t border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 1}
            onClick={() => goToStep((step - 1) as WizardStep)}
            data-testid="wizard-back"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 5 ? (
            <Button
              variant="brand"
              disabled={step === 4 && (!name.trim() || !about.trim())}
              onClick={() => goToStep((step + 1) as WizardStep)}
              data-testid="wizard-next"
            >
              {step === 1 && !selectedRef ? "Skip" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div /> // Generate button is in the content area for step 5
          )}
        </div>
      </div>
    </div>
  )
}
