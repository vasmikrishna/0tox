import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building2, Plus, Users } from "lucide-react"

export default async function SuperAdminDashboard() {
  const supabase = createClient()
  const { data: tenants } = await (supabase as any)
    .from("tenants")
    .select("*, users(id)")
    .order("created_at", { ascending: false })

  const total = tenants?.length ?? 0
  const active = tenants?.filter((t: any) => t.status === "active").length ?? 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">All tenants on 0toX</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/superadmin/tenants/new"><Plus className="h-4 w-4" /> New Tenant</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Tenants</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-500">{active}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Suspended</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-destructive">{total - active}</p></CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">All Tenants</h2>
        {(tenants ?? []).map((t: any) => (
          <Card key={t.id} className="hover:border-foreground/20 transition-colors">
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: t.primary_color }}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    <Badge variant={t.status === "active" ? "success" : "destructive"}>{t.status}</Badge>
                    <Badge variant="outline">{t.plan}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{t.slug}.site9.in</span>
                    <span className="mx-2">·</span>
                    <span className="capitalize">{t.industry.replace("_", " ")}</span>
                    <span className="mx-2">·</span>
                    <span className="flex items-center gap-1 inline-flex"><Users className="h-3 w-3" />{t.users?.length ?? 0} users</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/superadmin/tenants/${t.id}`}>Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
