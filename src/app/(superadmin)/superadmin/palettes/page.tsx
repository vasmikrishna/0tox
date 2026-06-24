import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Palette } from "lucide-react"
import type { ColorPalette } from "@/types"
import { PalettesList } from "./palettes-list"

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
        <PalettesList palettes={palettes} />
      )}
    </div>
  )
}
