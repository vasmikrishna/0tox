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
import type { SectionTemplate, SectionType, ContentStatus } from "@/types"
import Link from "next/link"

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "about", label: "About" },
  { value: "services", label: "Services" },
  { value: "testimonials", label: "Testimonials" },
  { value: "pricing", label: "Pricing" },
  { value: "faq", label: "FAQ" },
  { value: "team", label: "Team" },
  { value: "gallery", label: "Gallery" },
  { value: "cta", label: "CTA" },
  { value: "footer", label: "Footer" },
  { value: "contact", label: "Contact" },
]

interface SectionFormProps {
  initial?: SectionTemplate
}

export function SectionForm({ initial }: SectionFormProps) {
  const router = useRouter()
  const isEditing = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [sectionType, setSectionType] = useState<SectionType>(initial?.section_type ?? "hero")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [html, setHtml] = useState(initial?.html ?? "")
  const [css, setCss] = useState(initial?.css ?? "")
  const [previewUrl, setPreviewUrl] = useState(initial?.preview_url ?? "")
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "")
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "draft")
  const [saving, setSaving] = useState(false)
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
      section_type: sectionType,
      description: description.trim(),
      html: html.trim(),
      css: css.trim(),
      preview_url: previewUrl.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      sort_order: sortOrder,
      status: newStatus ?? status,
    }

    try {
      const url = isEditing
        ? `/api/superadmin/sections/${initial.id}`
        : "/api/superadmin/sections"
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
        router.push(`/superadmin/sections/${data.section.id}`)
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
    if (!confirm("Delete this section template permanently?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/sections/${initial!.id}`, { method: "DELETE" })
      if (res.ok) router.push("/superadmin/sections")
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
            <Link href="/superadmin/sections"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Section" : "New Section Template"}
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
                <Button
                  size="sm"
                  variant="default"
                  disabled={saving}
                  onClick={() => handleSave("approved")}
                  data-testid="approve-section-btn"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
              )}
              {status !== "archived" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => handleSave("archived")}
                  data-testid="archive-section-btn"
                >
                  <Archive className="h-4 w-4" /> Archive
                </Button>
              )}
              {status === "archived" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => handleSave("draft")}
                >
                  Unarchive
                </Button>
              )}
            </>
          )}
          <Button
            size="sm"
            variant="brand"
            disabled={saving || !name.trim() || !html.trim()}
            onClick={() => handleSave()}
            data-testid="save-section-btn"
          >
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
        {/* Left: Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dark Gradient Hero"
                  data-testid="section-name-input"
                />
              </div>
              <div>
                <Label>Section Type</Label>
                <Select value={sectionType} onValueChange={(v) => setSectionType(v as SectionType)}>
                  <SelectTrigger data-testid="section-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                  data-testid="section-desc-input"
                />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="dark, modern, gradient"
                  data-testid="section-tags-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    data-testid="section-sort-input"
                  />
                </div>
                <div>
                  <Label>Preview Image URL</Label>
                  <Input
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    placeholder="https://..."
                    data-testid="section-preview-url-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">HTML</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                rows={12}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<section>...</section>"
                className="font-mono text-xs"
                data-testid="section-html-editor"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">CSS</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                value={css}
                onChange={(e) => setCss(e.target.value)}
                placeholder=".my-section { ... }"
                className="font-mono text-xs"
                data-testid="section-css-editor"
              />
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="border-destructive/30">
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={saving}
                  onClick={handleDelete}
                  data-testid="delete-section-btn"
                >
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                data-testid="toggle-preview-btn"
              >
                <Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Show"}
              </Button>
            </CardHeader>
            {showPreview && html.trim() && (
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-white">
                  <iframe
                    title="Section preview"
                    srcDoc={previewSrcDoc}
                    sandbox=""
                    className="w-full"
                    style={{ height: "400px" }}
                    data-testid="section-preview-iframe"
                  />
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
