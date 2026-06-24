"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search } from "lucide-react"
import type { GalleryTemplate, ContentStatus } from "@/types"

const STATUS_VARIANT: Record<ContentStatus, "success" | "destructive" | "outline"> = {
  approved: "success",
  draft: "outline",
  archived: "destructive",
}

export function TemplatesList({ templates }: { templates: GalleryTemplate[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) =>
      `${t.name} ${t.description ?? ""} ${t.status} ${t.category} ${t.industry} ${t.style} ${t.tags.join(" ")}`
        .toLowerCase()
        .includes(q)
    )
  }, [templates, query])

  const grouped = {
    approved: filtered.filter((t) => t.status === "approved"),
    draft: filtered.filter((t) => t.status === "draft"),
    archived: filtered.filter((t) => t.status === "archived"),
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates by name, category, industry, style, or tag..."
          className="pl-9"
          data-testid="templates-search"
        />
      </div>

      {query && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No results for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="space-y-6">
          {(["approved", "draft", "archived"] as const).map((status) => {
            const items = grouped[status]
            if (items.length === 0) return null
            return (
              <div key={status}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {status} ({items.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((template) => (
                    <Link key={template.id} href={`/superadmin/templates/${template.id}`} data-testid={`template-card-${template.id}`}>
                      <Card className="hover:border-foreground/20 transition-colors h-full">
                        {template.preview_url && (
                          <div className="aspect-video bg-muted overflow-hidden rounded-t-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={template.preview_url} alt={template.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{template.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {template.description || "No description"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant={STATUS_VARIANT[template.status]}>{template.status}</Badge>
                              {template.featured && <Badge variant="default">Featured</Badge>}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
                            <Badge variant="outline" className="text-[10px]">{template.industry}</Badge>
                            <Badge variant="outline" className="text-[10px]">{template.style}</Badge>
                          </div>
                          {template.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {template.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
