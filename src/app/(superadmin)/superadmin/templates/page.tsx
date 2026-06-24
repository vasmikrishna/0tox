import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, LayoutTemplate } from "lucide-react"
import type { GalleryTemplate } from "@/types"
import { TemplatesList } from "./templates-list"

export default async function TemplatesPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("page_templates_gallery")
    .select("*")
    .order("sort_order", { ascending: true })

  const templates = (data ?? []) as GalleryTemplate[]

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
        <TemplatesList templates={templates} />
      )}
    </div>
  )
}
