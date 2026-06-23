import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, LayoutTemplate } from "lucide-react"
import type { GalleryTemplate, ContentStatus } from "@/types"

const STATUS_VARIANT: Record<ContentStatus, "success" | "destructive" | "outline"> = {
  approved: "success",
  draft: "outline",
  archived: "destructive",
}

export default async function TemplatesPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("page_templates_gallery")
    .select("*")
    .order("sort_order", { ascending: true })

  const templates = (data ?? []) as GalleryTemplate[]

  const grouped = {
    approved: templates.filter((t) => t.status === "approved"),
    draft: templates.filter((t) => t.status === "draft"),
    archived: templates.filter((t) => t.status === "archived"),
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Page Templates</h1>
          <p className="text-muted-foreground mt-1">
            Full-page website templates for the public gallery ({templates.length} total)
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/superadmin/templates/new" data-testid="new-template-btn">
            <Plus className="h-4 w-4" /> New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutTemplate className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No page templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create templates or run the seed script to populate the gallery.
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
