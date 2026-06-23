"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, LayoutTemplate, Star } from "lucide-react"
import Link from "next/link"
import type { GalleryTemplateMeta, TemplateCategory, TemplateStyle } from "@/types"

const CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "landing", label: "Landing" },
  { value: "portfolio", label: "Portfolio" },
  { value: "business", label: "Business" },
  { value: "coming-soon", label: "Coming Soon" },
  { value: "blog", label: "Blog" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "event", label: "Event" },
  { value: "personal", label: "Personal" },
]

const STYLES: { value: TemplateStyle | "all"; label: string }[] = [
  { value: "all", label: "All Styles" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "warm", label: "Warm" },
  { value: "elegant", label: "Elegant" },
  { value: "playful", label: "Playful" },
  { value: "corporate", label: "Corporate" },
  { value: "dark", label: "Dark" },
]

const INDUSTRIES = [
  { value: "all", label: "All Industries" },
  { value: "restaurant", label: "Restaurant" },
  { value: "salon", label: "Salon" },
  { value: "photography", label: "Photography" },
  { value: "professional", label: "Professional" },
  { value: "retail", label: "Retail" },
  { value: "fitness", label: "Fitness" },
  { value: "healthcare", label: "Healthcare" },
  { value: "consulting", label: "Consulting" },
  { value: "technology", label: "Technology" },
  { value: "education", label: "Education" },
]

const LIMIT = 24

export function GalleryClient() {
  const [templates, setTemplates] = useState<GalleryTemplateMeta[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>("all")
  const [industry, setIndustry] = useState<string>("all")
  const [style, setStyle] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (category !== "all") params.set("category", category)
    if (industry !== "all") params.set("industry", industry)
    if (style !== "all") params.set("style", style)
    if (debouncedSearch) params.set("search", debouncedSearch)

    try {
      const res = await fetch(`/api/templates?${params}`)
      const data = await res.json()
      if (res.ok) {
        setTemplates(data.templates)
        setTotal(data.total)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, category, industry, style, debouncedSearch])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])
  useEffect(() => { setPage(1) }, [category, industry, style, debouncedSearch])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            data-testid={`filter-category-${c.value}`}
            className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
              category === c.value
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
            data-testid="gallery-search-input"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-[160px]" data-testid="gallery-industry-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger className="w-[140px]" data-testid="gallery-style-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-border py-16 text-center">
          <LayoutTemplate className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">No templates found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} template{total !== 1 ? "s" : ""} found</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Link key={template.id} href={`/templates/${template.slug}`} data-testid={`gallery-card-${template.slug}`}>
                <div className="rounded-xl border border-border overflow-hidden bg-card hover:border-foreground/20 hover:shadow-lg transition-all h-full group">
                  <div className="aspect-[16/10] overflow-hidden relative bg-muted">
                    {template.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={template.preview_url}
                        alt={template.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {template.featured && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" /> Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-[15px]">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{template.industry}</Badge>
                      <Badge variant="outline" className="text-[10px]">{template.style}</Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} data-testid="gallery-prev-page">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} data-testid="gallery-next-page">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
