import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, Building2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

const INDUSTRY_LABELS: Record<string, string> = {
  software: "Software / Tech",
  real_estate: "Real Estate",
  healthcare: "Healthcare",
  legal: "Legal / Law",
  marketing: "Marketing / Creative",
  ecommerce: "E-commerce",
  education: "Education",
  hospitality: "Hospitality",
  finance: "Finance / Accounting",
  construction: "Construction",
  fitness: "Fitness / Wellness",
  consulting: "Consulting",
}

export default async function TenantsPage() {
  const supabase = createClient()
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
        <div className="space-y-2">
          {tenants.map((t: any) => (
            <Card key={t.id} className="hover:border-foreground/20 transition-colors">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-base font-bold text-white shrink-0"
                    style={{ backgroundColor: t.primary_color }}>
                    {t.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t.name}</span>
                      <Badge variant={t.status === "active" ? "success" : t.status === "suspended" ? "destructive" : "warning"}>
                        {t.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{t.plan}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{t.slug}.0tox.com</span>
                      <span>·</span>
                      <span>{INDUSTRY_LABELS[t.industry] ?? t.industry}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{t.users?.length ?? 0} users
                      </span>
                      <span>·</span>
                      <span>Created {formatDate(t.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/superadmin/tenants/${t.id}`}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
