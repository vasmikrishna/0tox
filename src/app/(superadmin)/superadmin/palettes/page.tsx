import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Palette } from "lucide-react"
import type { ColorPalette, ContentStatus } from "@/types"

const STATUS_VARIANT: Record<ContentStatus, "success" | "destructive" | "outline"> = {
  approved: "success",
  draft: "outline",
  archived: "destructive",
}

export default async function PalettesPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("color_palettes")
    .select("*")
    .order("sort_order", { ascending: true })

  const palettes = (data ?? []) as ColorPalette[]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Color Palettes</h1>
          <p className="text-muted-foreground mt-1">
            Curated color schemes for the website builder
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/superadmin/palettes/new" data-testid="new-palette-btn">
            <Plus className="h-4 w-4" /> New Palette
          </Link>
        </Button>
      </div>

      {palettes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Palette className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No color palettes yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create palettes for the builder color selection step.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {palettes.map((palette) => {
            const c = palette.colors
            return (
              <Link
                key={palette.id}
                href={`/superadmin/palettes/${palette.id}`}
                data-testid={`palette-card-${palette.id}`}
              >
                <Card className="hover:border-foreground/20 transition-colors h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{palette.name}</p>
                      <Badge variant={STATUS_VARIANT[palette.status]}>{palette.status}</Badge>
                    </div>

                    {/* Color swatches */}
                    <div className="flex gap-1 rounded-lg overflow-hidden">
                      {(["primary", "secondary", "accent", "background", "text", "muted"] as const).map((key) => (
                        <div
                          key={key}
                          className="h-10 flex-1"
                          style={{ backgroundColor: c[key] }}
                          title={`${key}: ${c[key]}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {palette.industry === "all" ? "Universal" : palette.industry}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Order: {palette.sort_order}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
