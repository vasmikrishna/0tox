"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, LayoutTemplate, Loader2 } from "lucide-react"
import type { GalleryTemplate } from "@/types"

interface TemplateBrowserProps {
  onSelect: (html: string, css: string) => void
}

const INDUSTRIES = [
  "all", "restaurant", "salon", "photography", "professional",
  "retail", "fitness", "healthcare", "consulting", "technology", "education",
]

export function TemplateBrowser({ onSelect }: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<GalleryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [industry, setIndustry] = useState("all")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: "50" })
    if (industry !== "all") params.set("industry", industry)
    if (debouncedSearch) params.set("search", debouncedSearch)

    try {
      const res = await fetch(`/api/templates?${params}`)
      const data = await res.json()
      if (res.ok) setTemplates(data.templates ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [industry, debouncedSearch])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function handlePick(slug: string) {
    setApplying(slug)
    try {
      const res = await fetch(`/api/templates/${slug}`)
      const data = await res.json()
      if (res.ok && data.template) {
        onSelect(data.template.html, data.template.css)
      }
    } catch {
      // silently fail
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-semibold">Templates</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 h-8 text-xs"
            data-testid="template-browser-search"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              data-testid={`tmpl-filter-${ind}`}
              className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors cursor-pointer ${
                industry === ind
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {ind === "all" ? "All" : ind.charAt(0).toUpperCase() + ind.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground">No templates found</p>
          </div>
        ) : (
          templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handlePick(tpl.slug)}
              disabled={!!applying}
              data-testid={`tmpl-pick-${tpl.slug}`}
              className="w-full text-left rounded-lg border border-border overflow-hidden hover:border-foreground/30 transition-colors disabled:opacity-50"
            >
              {tpl.preview_url && (
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tpl.preview_url} alt={tpl.name} className="h-full w-full object-cover object-top" loading="lazy" />
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  {applying === tpl.slug && <Loader2 className="h-3 w-3 animate-spin" />}
                  {tpl.name}
                </p>
                <div className="mt-1 flex gap-1">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{tpl.industry}</Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{tpl.style}</Badge>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
