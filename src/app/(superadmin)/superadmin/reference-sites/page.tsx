import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Globe } from "lucide-react"
import type { ReferenceSite } from "@/types"
import { ReferenceSitesList } from "./reference-sites-list"

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
        <ReferenceSitesList sites={sites} />
      )}
    </div>
  )
}
