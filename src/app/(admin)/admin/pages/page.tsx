import { Card, CardContent } from "@/components/ui/card"
import type { CustomPage } from "@/types"
import { MOCK_CUSTOM_PAGES } from "@/lib/mock-data"
import { PagesAdmin } from "./pages-admin"
import { PagesList } from "./pages-list"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getPages(): Promise<CustomPage[]> {
  if (!supabaseConfigured()) return MOCK_CUSTOM_PAGES
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const { getCurrentTenant } = await import("@/lib/tenant")
    const supabase = createClient()
    const tenant = await getCurrentTenant().catch(() => null)
    let query = supabase.from("custom_pages").select("*").order("updated_at", { ascending: false })
    if (tenant?.id) query = query.eq("tenant_id", tenant.id)
    const { data } = await query
    return (data as CustomPage[] | null)?.length ? (data as CustomPage[]) : MOCK_CUSTOM_PAGES
  } catch {
    return MOCK_CUSTOM_PAGES
  }
}

export default async function AdminPagesListPage() {
  const pages = await getPages()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground mt-1">Build and publish custom HTML pages</p>
        </div>
        <PagesAdmin />
      </div>

      {!supabaseConfigured() && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Demo mode — showing sample pages. Connect Supabase to create and persist pages.
        </div>
      )}

      {pages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No pages yet — create your first one above.
          </CardContent>
        </Card>
      ) : (
        <PagesList pages={pages} />
      )}
    </div>
  )
}
