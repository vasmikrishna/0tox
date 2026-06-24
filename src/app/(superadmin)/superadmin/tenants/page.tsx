import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Building2 } from "lucide-react"
import { TenantsList } from "./tenants-list"

export default async function TenantsPage() {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenants } = await (supabase as any)
    .from("tenants")
    .select("*, users(id)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Tenants</h1>
          <p className="text-muted-foreground mt-1">{tenants?.length ?? 0} tenants on the platform</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/superadmin/tenants/new"><Plus className="h-4 w-4" /> New Tenant</Link>
        </Button>
      </div>

      {(!tenants || tenants.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm mb-4">No tenants yet</p>
            <Button asChild variant="brand" size="sm">
              <Link href="/superadmin/tenants/new"><Plus className="h-4 w-4" /> Create first tenant</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TenantsList tenants={tenants} />
      )}
    </div>
  )
}
