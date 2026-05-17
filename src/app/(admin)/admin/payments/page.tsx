import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { MOCK_PAYMENTS, MOCK_PROJECTS } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  pending: { label: "Pending",  variant: "warning" },
  paid:    { label: "Paid",     variant: "success" },
  overdue: { label: "Overdue",  variant: "destructive" },
}

const methodLabel: Record<string, string> = {
  stripe:        "Card (Stripe)",
  bank_transfer: "Bank transfer",
  other:         "Other",
}

export default async function AdminPaymentsPage() {
  let payments: any[] = []
  let projects: any[] = []

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const [{ data: pay }, { data: proj }] = await Promise.all([
      supabase.from("payments").select("*, projects(title, id)").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, title"),
    ])
    payments = pay ?? []
    projects = proj ?? []
  } else {
    payments = MOCK_PAYMENTS.map(p => ({
      ...p,
      projects: MOCK_PROJECTS.find(proj => proj.id === p.project_id),
    }))
    projects = MOCK_PROJECTS
  }

  const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0)
  const totalPending   = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0)
  const totalOverdue   = payments.filter(p => p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground mt-1">All payment records across projects</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-2xl font-bold text-green-500">{formatCurrency(totalCollected)}</p>
            <p className="text-sm text-muted-foreground mt-1">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-2xl font-bold text-amber-500">{formatCurrency(totalPending)}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-2xl font-bold">{formatCurrency(totalCollected + totalPending + totalOverdue)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total invoiced</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments table */}
      {!payments.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No payments yet — they appear here once added to a project
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs text-muted-foreground font-medium">
                <div className="col-span-3">Description</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              {payments.map((payment) => {
                const status = statusConfig[payment.status] ?? statusConfig.pending
                const project = payment.projects
                return (
                  <div key={payment.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-3">
                      <p className="text-sm font-medium">{payment.label}</p>
                    </div>
                    <div className="col-span-3">
                      {project ? (
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {project.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">{methodLabel[payment.method] ?? payment.method}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">
                        {payment.paid_at
                          ? formatDate(payment.paid_at)
                          : payment.due_date
                          ? `Due ${formatDate(payment.due_date)}`
                          : "—"}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
