"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { PAGE_TEMPLATES } from "@/lib/page-templates"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function PagesAdmin() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugDirty, setSlugDirty] = useState(false)
  const [template, setTemplate] = useState(PAGE_TEMPLATES[0]?.key ?? "blank")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  function setTitleAndSlug(value: string) {
    setTitle(value)
    if (!slugDirty) setSlug(slugify(value))
  }

  async function create() {
    if (!title.trim()) return
    setCreating(true)
    setError("")
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), slug: slug.trim(), template }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to create page")
        setCreating(false)
        return
      }
      router.push(`/admin/pages/${data.page.id}`)
    } catch {
      setError("Failed to create page")
      setCreating(false)
    }
  }

  if (!open) {
    return (
      <Button data-testid="page-new-btn" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New page
      </Button>
    )
  }

  return (
    <>
      <Button data-testid="page-new-btn" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New page
      </Button>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">New page</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Pick a starting template, then customise in the editor.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-page-title">Title</Label>
            <Input
              id="new-page-title"
              data-testid="page-new-title-input"
              value={title}
              onChange={(e) => setTitleAndSlug(e.target.value)}
              placeholder="About us"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-page-slug">Slug</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/p/</span>
              <Input
                id="new-page-slug"
                data-testid="page-new-slug-input"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugDirty(true) }}
                placeholder="about-us"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-3">
              {PAGE_TEMPLATES.map((tpl) => (
                <label
                  key={tpl.key}
                  data-testid={`page-new-template-${tpl.key}`}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                    template === tpl.key ? "border-foreground" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={tpl.key}
                    checked={template === tpl.key}
                    onChange={() => setTemplate(tpl.key)}
                    className="sr-only"
                  />
                  <p className="font-medium text-sm">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" data-testid="page-new-cancel-btn" onClick={() => setOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button data-testid="page-new-create-btn" onClick={create} disabled={!title.trim() || creating}>
              {creating ? "Creating…" : "Create page"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
