import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ArrowRight, User, Mail, Calendar } from "lucide-react"
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_PAYMENTS } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "brand" | "success" | "destructive" }> = {
  intake:    { label: "Submitted",   variant: "default" },
  review:    { label: "In Review",   variant: "warning" },
  active:    { label: "In Progress", variant: "brand" },
  completed: { label: "Completed",   variant: "success" },
  cancelled: { label: "Cancelled",   variant: "destructive" },
}

const tierLabel: Record<string, string> = { starter: "Starter", standard: "Standard", pro: "Pro" }

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let client: any = null
  let projects: any[] = []
  let payments: any[] = []

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()

    const { data: c } = await supabase.from("users").select("*").eq("id", id).single()
    client = c
    if (!client) notFound()

    const [{ data: proj }, { data: pay }] = await Promise.all([
      supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*, projects(title)").eq("projects.client_id", id),
    ])
    projects = proj ?? []
    payments = pay ?? []
  } else {
    client = MOCK_CLIENTS.find(c => c.id === id)
    if (!client) notFound()
    projects = MOCK_PROJECTS.filter(p => p.client_id === id)
    const projectIds = projects.map(p => p.id)
    payments = MOCK_PAYMENTS.filter(p => projectIds.includes(p.project_id)).map(p => ({
      ...p,
      projects: projects.find(proj => proj.id === p.project_id),
    }))
  }

  const totalPaid    = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold flex-shrink-0">
            {client.name?.charAt(0)?.toUpperCase() ?? <User className="h-5 w-5" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{client.email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {formatDate(client.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 pb-5">
          <p className="text-2xl font-bold">{projects.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Projects</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 pb-5">
          <p className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-muted-foreground mt-1">Paid</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 pb-5">
          <p className="text-2xl font-bold text-amber-500">{formatCurrency(totalPending)}</p>
          <p className="text-sm text-muted-foreground mt-1">Outstanding</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <Card>
          <CardHeader><CardTitle className="text-base">Projects</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!projects.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
            ) : projects.map((project) => {
              const status = statusConfig[project.status]
              return (
                <div key={project.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tierLabel[project.service_tier]} · {formatDate(project.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status?.variant}>{status?.label}</Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/projects/${project.id}`}><ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader><CardTitle className="text-base">Payment history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!payments.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
            ) : payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{payment.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {payment.projects?.title}
                    {payment.paid_at ? ` · Paid ${formatDate(payment.paid_at)}` : payment.due_date ? ` · Due ${formatDate(payment.due_date)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{formatCurrency(payment.amount)}</p>
                  <Badge variant={payment.status === "paid" ? "success" : payment.status === "overdue" ? "destructive" : "warning"}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
