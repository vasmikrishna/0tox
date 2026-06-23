"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, LayoutGrid, Type, Users, Star, DollarSign,
  HelpCircle, UserCircle, ImageIcon, Megaphone, Footprints, Mail,
} from "lucide-react"
import type { SectionTemplate, SectionType } from "@/types"

const TYPE_ICONS: Record<SectionType, React.ReactNode> = {
  hero: <LayoutGrid className="h-3.5 w-3.5" />,
  about: <Type className="h-3.5 w-3.5" />,
  services: <LayoutGrid className="h-3.5 w-3.5" />,
  testimonials: <Star className="h-3.5 w-3.5" />,
  pricing: <DollarSign className="h-3.5 w-3.5" />,
  faq: <HelpCircle className="h-3.5 w-3.5" />,
  team: <Users className="h-3.5 w-3.5" />,
  gallery: <ImageIcon className="h-3.5 w-3.5" />,
  cta: <Megaphone className="h-3.5 w-3.5" />,
  footer: <Footprints className="h-3.5 w-3.5" />,
  contact: <Mail className="h-3.5 w-3.5" />,
}

const TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  about: "About",
  services: "Services",
  testimonials: "Testimonials",
  pricing: "Pricing",
  faq: "FAQ",
  team: "Team",
  gallery: "Gallery",
  cta: "Call to Action",
  footer: "Footer",
  contact: "Contact",
}

interface SectionLibraryProps {
  onInsert: (section: SectionTemplate) => void
}

export function SectionLibrary({ onInsert }: SectionLibraryProps) {
  const [sections, setSections] = useState<SectionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedType, setExpandedType] = useState<SectionType | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/build/sections")
        const data = await res.json()
        setSections(data.sections ?? [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = search.trim()
    ? sections.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : sections

  const grouped = new Map<SectionType, SectionTemplate[]>()
  for (const s of filtered) {
    const existing = grouped.get(s.section_type) ?? []
    existing.push(s)
    grouped.set(s.section_type, existing)
  }

  const typeOrder: SectionType[] = ["hero", "about", "services", "testimonials", "pricing", "faq", "team", "gallery", "cta", "contact", "footer"]

  return (
    <div className="flex h-full flex-col" data-testid="section-library">
      <div className="px-3 py-3 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Add Section
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sections..."
            className="pl-8 h-8 text-xs"
            data-testid="section-search"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-muted-foreground">
            <LayoutGrid className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs">{search ? "No matching sections" : "No sections available"}</p>
          </div>
        ) : (
          <div className="py-1">
            {typeOrder.map((type) => {
              const items = grouped.get(type)
              if (!items || items.length === 0) return null
              const isExpanded = expandedType === type || !!search.trim()
              return (
                <div key={type}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                    data-testid={`section-type-${type}`}
                  >
                    {TYPE_ICONS[type]}
                    <span className="flex-1 text-left">{TYPE_LABELS[type]}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5">{items.length}</Badge>
                  </button>
                  {isExpanded && (
                    <div className="px-2 pb-2 space-y-1">
                      {items.map((section) => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => onInsert(section)}
                          className="w-full rounded-lg border border-border bg-card p-2 text-left hover:border-brand/60 hover:bg-accent/50 transition-colors"
                          data-testid={`insert-section-${section.id}`}
                        >
                          {section.preview_url && (
                            <div className="aspect-video rounded bg-muted mb-1.5 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={section.preview_url} alt="" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <p className="text-xs font-medium">{section.name}</p>
                          {section.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{section.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
