import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { MOCK_PROJECTS, MOCK_CLIENTS, MOCK_PAYMENTS } from "@/lib/mock-data"

const statusConfig: Record<string, { label: string; variant: "default"|"warning"|"brand"|"success"|"destructive" }> = {
  intake:    { label: "Submitted",   variant: "default" },
  review:    { label: "In Review",   variant: "warning" },
  active:    { label: "In Progress", variant: "brand" },
  completed: { label: "Completed",   variant: "success" },
  cancelled: { label: "Cancelled",   variant: "destructive" },
}

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminDashboard() {
  let projects: any[] = []
  let clientCount = 0
  let totalRevenue = 0
  let pendingRevenue = 0

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const [{ data: p }, { data: c }, { data: pay }] = await Promise.all([
      supabase.from("projects").select("*, users(name, email)").order("created_at", { ascending: false }).limit(10),
      supabase.from("users").select("id").eq("role", "client"),
      supabase.from("payments").select("amount, status"),
    ])
    projects = p ?? []
    clientCount = c?.length ?? 0
    totalRevenue = pay?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0
    pendingRevenue = pay?.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0) ?? 0
  } else {
    projects = MOCK_PROJECTS
    clientCount = MOCK_CLIENTS.length
    totalRevenue = MOCK_PAYMENTS.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0)
    pendingRevenue = MOCK_PAYMENTS.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0)
  }

  const newSubmissions = projects.filter(p => p.status === "intake").length
  const activeProjects = projects.filter(p => p.status === "active").length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of all activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{projects.length}</p><p className="text-sm text-muted-foreground mt-1">Total projects</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold text-amber-500">{newSubmissions}</p><p className="text-sm text-muted-foreground mt-1">Needs review</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{activeProjects}</p><p className="text-sm text-muted-foreground mt-1">Active projects</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{clientCount}</p><p className="text-sm text-muted-foreground mt-1">Clients</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p><p className="text-sm text-muted-foreground mt-1">Revenue collected</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</p><p className="text-sm text-muted-foreground mt-1">Pending payments</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Button asChild variant="ghost" size="sm"><Link href="/admin/projects">View all <ArrowRight className="h-3 w-3" /></Link></Button>
        </div>
        {!projects.length ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground text-sm">No projects yet — connect Supabase to see live data</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => {
              const status = statusConfig[project.status]
              return (
                <Card key={project.id} className="hover:border-foreground/20 transition-colors">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.users?.name} · {formatDate(project.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status?.variant}>{status?.label}</Badge>
                      <Button asChild variant="ghost" size="sm"><Link href={`/admin/projects/${project.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
