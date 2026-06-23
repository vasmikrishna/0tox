import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Globe } from "lucide-react"
import type { ReferenceSite, ContentStatus } from "@/types"

const STATUS_VARIANT: Record<ContentStatus, "success" | "destructive" | "outline"> = {
  approved: "success",
  draft: "outline",
  archived: "destructive",
}

export default async function ReferenceSitesPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("reference_sites")
    .select("*")
    .order("sort_order", { ascending: true })

  const sites = (data ?? []) as ReferenceSite[]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reference Sites</h1>
          <p className="text-muted-foreground mt-1">
            Curated websites shown during onboarding for style inspiration
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/superadmin/reference-sites/new" data-testid="new-reference-site-btn">
            <Plus className="h-4 w-4" /> New Reference Site
          </Link>
        </Button>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No reference sites yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create reference websites for the builder onboarding gallery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Link
              key={site.id}
              href={`/superadmin/reference-sites/${site.id}`}
              data-testid={`ref-site-card-${site.id}`}
            >
              <Card className="hover:border-foreground/20 transition-colors h-full">
                <div className="aspect-video bg-muted overflow-hidden rounded-t-xl relative">
                  {site.html?.trim() ? (
                    <iframe
                      title={`${site.name} preview`}
                      srcDoc={site.html.trim().startsWith("<!") ? site.html : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif;}${site.css || ""}</style></head><body>${site.html}</body></html>`}
                      sandbox=""
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{
                        width: "1440px",
                        height: "900px",
                        transform: "scale(0.265)",
                        transformOrigin: "top left",
                      }}
                      data-testid={`ref-site-preview-${site.id}`}
                    />
                  ) : site.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={site.thumbnail_url}
                      alt={site.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Globe className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{site.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {site.description || "No description"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={STATUS_VARIANT[site.status]}>{site.status}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{site.industry}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
