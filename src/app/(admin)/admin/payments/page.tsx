import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { MOCK_PAYMENTS, MOCK_PROJECTS } from "@/lib/mock-data"
import { PaymentsList } from "./payments-list"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <PaymentsList payments={payments} />
      )}
    </div>
  )
}
