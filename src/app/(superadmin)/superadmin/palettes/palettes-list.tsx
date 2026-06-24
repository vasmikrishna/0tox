"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PaginatedList } from "@/components/paginated-list"
import type { ColorPalette, ContentStatus } from "@/types"

const STATUS_VARIANT: Record<ContentStatus, "success" | "destructive" | "outline"> = {
  approved: "success",
  draft: "outline",
  archived: "destructive",
}

export function PalettesList({ palettes }: { palettes: ColorPalette[] }) {
  return (
    <PaginatedList
      items={palettes}
      pageSize={12}
      searchPlaceholder="Search palettes by name, status, or industry..."
      testId="palettes"
      searchText={(palette) => `${palette.name} ${palette.status} ${palette.industry}`}
    >
      {(pagePalettes) => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagePalettes.map((palette) => {
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
    </PaginatedList>
  )
}
