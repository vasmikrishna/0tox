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
import { ArrowLeft, Save, CheckCircle, Archive, Eye, Wand2 } from "lucide-react"
import type { ReferenceSite, ContentStatus } from "@/types"
import Link from "next/link"

const INDUSTRIES = [
  { value: "restaurant", label: "Restaurant / Cafe" },
  { value: "salon", label: "Salon / Beauty" },
  { value: "photography", label: "Photography" },
  { value: "professional", label: "Professional" },
  { value: "retail", label: "Retail / Shop" },
  { value: "saas", label: "SaaS / Tech" },
  { value: "agency", label: "Agency / Studio" },
  { value: "portfolio", label: "Portfolio" },
  { value: "other", label: "Other" },
]

interface ReferenceSiteFormProps {
  initial?: ReferenceSite
}

export function ReferenceSiteForm({ initial }: ReferenceSiteFormProps) {
  const router = useRouter()
  const isEditing = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [industry, setIndustry] = useState(initial?.industry ?? "other")
  const [html, setHtml] = useState(initial?.html ?? "")
  const [css, setCss] = useState(initial?.css ?? "")
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "")
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "draft")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(true)

  async function handleSave(newStatus?: ContentStatus) {
    if (!name.trim() || !html.trim()) {
      setError("Name and HTML are required")
      return
    }
    setError("")
    setSaving(true)

    const payload = {
      name: name.trim(),
      description: description.trim(),
      industry,
      html: html.trim(),
      css: css.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      sort_order: sortOrder,
      status: newStatus ?? status,
    }

    try {
      const url = isEditing
        ? `/api/superadmin/reference-sites/${initial.id}`
        : "/api/superadmin/reference-sites"
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
        router.push(`/superadmin/reference-sites/${data.site.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateWithAi() {
    if (!aiPrompt.trim()) return
    setError("")
    setGenerating(true)
    try {
      const res = await fetch("/api/build/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "AI generation failed")
        return
      }
      setHtml(data.html)
      setCss("")
    } catch {
      setError("Could not reach AI")
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this reference site permanently?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/reference-sites/${initial!.id}`, { method: "DELETE" })
      if (res.ok) router.push("/superadmin/reference-sites")
      else setError("Failed to delete")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const previewSrcDoc = html.trim().startsWith("<!") ? html : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif;}${css}</style></head><body>${html}</body></html>`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/superadmin/reference-sites"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Reference Site" : "New Reference Site"}
            </h1>
            {isEditing && (
              <Badge variant={status === "approved" ? "success" : status === "archived" ? "destructive" : "outline"} className="mt-1">
                {status}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              {status !== "approved" && (
                <Button size="sm" variant="default" disabled={saving} onClick={() => handleSave("approved")} data-testid="approve-ref-site-btn">
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
              )}
              {status !== "archived" && (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSave("archived")} data-testid="archive-ref-site-btn">
                  <Archive className="h-4 w-4" /> Archive
                </Button>
              )}
              {status === "archived" && (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSave("draft")}>Unarchive</Button>
              )}
            </>
          )}
          <Button
            size="sm"
            variant="brand"
            disabled={saving || !name.trim() || !html.trim()}
            onClick={() => handleSave()}
            data-testid="save-ref-site-btn"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Modern SaaS Landing" data-testid="ref-site-name-input" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" data-testid="ref-site-desc-input" />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger data-testid="ref-site-industry-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} data-testid="ref-site-sort-input" />
                </div>
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." data-testid="ref-site-thumb-input" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Generate with AI</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the website... e.g. A modern creative agency with dark theme, services grid, team section, and contact form"
                data-testid="ref-site-ai-prompt"
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={generating || !aiPrompt.trim()}
                onClick={handleGenerateWithAi}
                data-testid="ref-site-generate-btn"
              >
                <Wand2 className="h-4 w-4" /> {generating ? "Generating…" : "Generate HTML with AI"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">HTML</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                rows={16}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<!DOCTYPE html>..."
                className="font-mono text-xs"
                data-testid="ref-site-html-editor"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">CSS (optional, for non-inline styles)</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                rows={6}
                value={css}
                onChange={(e) => setCss(e.target.value)}
                placeholder="Additional CSS..."
                className="font-mono text-xs"
                data-testid="ref-site-css-editor"
              />
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="border-destructive/30">
              <CardContent className="pt-6">
                <Button variant="destructive" size="sm" disabled={saving} onClick={handleDelete} data-testid="delete-ref-site-btn">
                  Delete permanently
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Live Preview</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)} data-testid="toggle-ref-preview-btn">
                <Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Show"}
              </Button>
            </CardHeader>
            {showPreview && html.trim() && (
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-white">
                  <iframe
                    title="Reference site preview"
                    srcDoc={previewSrcDoc}
                    sandbox=""
                    className="w-full"
                    style={{ height: "600px" }}
                    data-testid="ref-site-preview-iframe"
                  />
                </div>
              </CardContent>
            )}
            {showPreview && !html.trim() && (
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Add HTML or use AI to generate a reference site
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
