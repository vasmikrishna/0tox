import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, LayoutGrid } from "lucide-react"
import type { SectionTemplate } from "@/types"
import { SectionsList } from "./sections-list"

export default async function SectionsPage() {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("section_templates")
    .select("*")
    .order("sort_order", { ascending: true })

  const sections = (data ?? []) as SectionTemplate[]

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
        <SectionsList sections={sections} />
      )}
    </div>
  )
}
