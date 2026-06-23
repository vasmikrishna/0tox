import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, LayoutGrid } from "lucide-react"
import type { SectionTemplate, ContentStatus } from "@/types"

const STATUS_VARIANT: Record<ContentStatus, "success" | "destructive" | "outline"> = {
  approved: "success",
  draft: "outline",
  archived: "destructive",
}

export default async function SectionsPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("section_templates")
    .select("*")
    .order("sort_order", { ascending: true })

  const sections = (data ?? []) as SectionTemplate[]

  const grouped = {
    approved: sections.filter((s) => s.status === "approved"),
    draft: sections.filter((s) => s.status === "draft"),
    archived: sections.filter((s) => s.status === "archived"),
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Section Templates</h1>
          <p className="text-muted-foreground mt-1">
            Reusable page sections for the website builder
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/superadmin/sections/new" data-testid="new-section-btn">
            <Plus className="h-4 w-4" /> New Section
          </Link>
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No section templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first section template to populate the builder library.
            </p>
          </CardContent>
        </Card>
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
                  {items.map((section) => (
                    <Link
                      key={section.id}
                      href={`/superadmin/sections/${section.id}`}
                      data-testid={`section-card-${section.id}`}
                    >
                      <Card className="hover:border-foreground/20 transition-colors h-full">
                        {section.preview_url && (
                          <div className="aspect-video bg-muted overflow-hidden rounded-t-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={section.preview_url}
                              alt={section.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{section.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {section.description || "No description"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant={STATUS_VARIANT[section.status]}>
                                {section.status}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {section.section_type}
                              </Badge>
                            </div>
                          </div>
                          {section.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {section.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                                >
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
