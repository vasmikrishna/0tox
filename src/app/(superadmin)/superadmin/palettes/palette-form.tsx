"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, CheckCircle, Archive } from "lucide-react"
import type { ColorPalette, ColorPaletteColors, ContentStatus } from "@/types"
import Link from "next/link"

const INDUSTRIES = [
  { value: "all", label: "Universal" },
  { value: "restaurant", label: "Restaurant / Cafe" },
  { value: "salon", label: "Salon / Beauty" },
  { value: "photography", label: "Photography" },
  { value: "professional", label: "Professional" },
  { value: "retail", label: "Retail / Shop" },
  { value: "saas", label: "SaaS / Tech" },
  { value: "agency", label: "Agency / Studio" },
  { value: "other", label: "Other" },
]

const COLOR_FIELDS: { key: keyof ColorPaletteColors; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
  { key: "muted", label: "Muted" },
]

const DEFAULT_COLORS: ColorPaletteColors = {
  primary: "#1B3A6B",
  secondary: "#E8F0FE",
  accent: "#FF6B35",
  background: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#6B7280",
}

interface PaletteFormProps {
  initial?: ColorPalette
}

export function PaletteForm({ initial }: PaletteFormProps) {
  const router = useRouter()
  const isEditing = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [colors, setColors] = useState<ColorPaletteColors>(initial?.colors ?? DEFAULT_COLORS)
  const [industry, setIndustry] = useState(initial?.industry ?? "all")
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "draft")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function updateColor(key: keyof ColorPaletteColors, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(newStatus?: ContentStatus) {
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    setError("")
    setSaving(true)

    const payload = {
      name: name.trim(),
      colors,
      industry,
      sort_order: sortOrder,
      status: newStatus ?? status,
    }

    try {
      const url = isEditing
        ? `/api/superadmin/palettes/${initial.id}`
        : "/api/superadmin/palettes"
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
        router.push(`/superadmin/palettes/${data.palette.id}`)
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
    if (!confirm("Delete this palette permanently?")) return
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/palettes/${initial!.id}`, { method: "DELETE" })
      if (res.ok) router.push("/superadmin/palettes")
      else setError("Failed to delete")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/superadmin/palettes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Palette" : "New Color Palette"}
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
                <Button size="sm" variant="default" disabled={saving} onClick={() => handleSave("approved")} data-testid="approve-palette-btn">
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
              )}
              {status !== "archived" && (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSave("archived")} data-testid="archive-palette-btn">
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
            disabled={saving || !name.trim()}
            onClick={() => handleSave()}
            data-testid="save-palette-btn"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ocean Breeze" data-testid="palette-name-input" />
          </div>
          <div>
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger data-testid="palette-industry-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} data-testid="palette-sort-input" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Colors</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Live swatch bar */}
          <div className="flex gap-1 rounded-lg overflow-hidden">
            {COLOR_FIELDS.map(({ key }) => (
              <div
                key={key}
                className="h-14 flex-1 transition-colors"
                style={{ backgroundColor: colors[key] }}
                title={`${key}: ${colors[key]}`}
              />
            ))}
          </div>

          {/* Color inputs */}
          <div className="grid grid-cols-2 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border"
                  data-testid={`palette-color-${key}`}
                />
                <div className="flex-1">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    value={colors[key]}
                    onChange={(e) => updateColor(key, e.target.value)}
                    placeholder="#000000"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview: sample text */}
      <Card>
        <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
        <CardContent>
          <div
            className="rounded-lg p-6 space-y-3"
            style={{ backgroundColor: colors.background, color: colors.text }}
          >
            <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
              Sample Heading
            </h2>
            <p style={{ color: colors.text }}>
              This is how body text looks with the chosen palette.
            </p>
            <p className="text-sm" style={{ color: colors.muted }}>
              Muted text appears like this for secondary content.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: colors.primary, color: colors.background }}
              >
                Primary Button
              </button>
              <button
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: colors.accent, color: colors.background }}
              >
                Accent Button
              </button>
            </div>
            <div
              className="mt-3 rounded-md p-3"
              style={{ backgroundColor: colors.secondary }}
            >
              <p className="text-sm" style={{ color: colors.text }}>
                Secondary background card content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <Button variant="destructive" size="sm" disabled={saving} onClick={handleDelete} data-testid="delete-palette-btn">
              Delete permanently
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
