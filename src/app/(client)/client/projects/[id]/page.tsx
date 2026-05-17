import { notFound } from "next/navigation"
import { getSession } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Download, CheckCircle2, Circle, Loader2, CreditCard, ExternalLink } from "lucide-react"
import type { Stage, Payment, DeliverableFile } from "@/types"
import { cn } from "@/lib/utils"
import { MOCK_PROJECTS, MOCK_STAGES, MOCK_PAYMENTS } from "@/lib/mock-data"

const statusConfig = {
  intake:    { label: "Submitted",   variant: "default" as const },
  review:    { label: "In Review",   variant: "warning" as const },
  active:    { label: "In Progress", variant: "brand" as const },
  completed: { label: "Completed",   variant: "success" as const },
  cancelled: { label: "Cancelled",   variant: "destructive" as const },
}

const stageIcon = {
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
  in_progress: <Loader2 className="h-5 w-5 text-brand animate-spin" />,
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
}

const paymentStatusConfig = {
  pending: { label: "Pending", variant: "warning" as const },
  paid: { label: "Paid", variant: "success" as const },
  overdue: { label: "Overdue", variant: "destructive" as const },
}

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let project: any = null
  let stages: any[] = []
  let payments: any[] = []

  if (supabaseConfigured()) {
    try {
      const session = await getSession()
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data: dbUser } = await supabase.from("users").select("id").eq("email", session?.email ?? "").single()
      if (!dbUser) notFound()

      const { data: p } = await supabase.from("projects").select("*").eq("id", id).eq("client_id", dbUser.id).single()
      project = p
      if (!project) notFound()

      const [{ data: s }, { data: pay }] = await Promise.all([
        supabase.from("stages").select("*, deliverable_files(*)").eq("project_id", id).eq("visible_to_client", true).order("sort_order"),
        supabase.from("payments").select("*").eq("project_id", id).order("created_at"),
      ])
      stages = s ?? []
      payments = pay ?? []
    } catch { notFound() }
  } else {
    project = MOCK_PROJECTS.find(p => p.id === id) ?? MOCK_PROJECTS[1]
    stages = MOCK_STAGES.filter(s => s.project_id === project.id && s.visible_to_client)
    payments = MOCK_PAYMENTS.filter(p => p.project_id === project.id)
  }

  const status = statusConfig[project.status as keyof typeof statusConfig]
  const tierLabel = { starter: "Starter", standard: "Standard", pro: "Pro" }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {tierLabel[project.service_tier as keyof typeof tierLabel]} tier · Submitted {formatDate(project.created_at)}
          </p>
        </div>
      </div>

      {project.status === "intake" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="py-4 px-6 text-sm text-amber-800 dark:text-amber-300">
            ✅ <strong>Submitted!</strong> We&apos;ve received your project details and will be in touch within 24 hours to confirm scope and timeline.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Project stages</h2>
          {!stages?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Stages will appear here once your project is active
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {stages.map((stage: Stage & { deliverable_files: DeliverableFile[] }) => (
                <Card key={stage.id} className={cn(stage.status === "in_progress" && "border-foreground/30")}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">{stageIcon[stage.status]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("font-medium text-sm", stage.status === "pending" && "text-muted-foreground")}>{stage.name}</p>
                          {stage.status === "completed" && stage.completed_at && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">Done {formatDate(stage.completed_at)}</span>
                          )}
                          {stage.status === "in_progress" && (
                            <Badge variant="brand" className="text-xs flex-shrink-0">Active</Badge>
                          )}
                        </div>
                        {stage.description && <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>}
                        {stage.deliverable_files && stage.deliverable_files.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {stage.deliverable_files.map((file: DeliverableFile) => (
                              <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs bg-muted rounded-md px-3 py-2 hover:bg-accent transition-colors w-fit"
                              >
                                <Download className="h-3 w-3" />
                                {file.name}
                                <ExternalLink className="h-3 w-3 opacity-50" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payments</h2>
          {!payments?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Payment schedule will appear here once your project starts
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment: Payment) => {
                const pStatus = paymentStatusConfig[payment.status]
                return (
                  <Card key={payment.id}>
                    <CardContent className="py-4 px-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{payment.label}</p>
                          <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                        </div>
                        <Badge variant={pStatus.variant}>{pStatus.label}</Badge>
                      </div>
                      {payment.due_date && payment.status !== "paid" && (
                        <p className="text-xs text-muted-foreground">Due {formatDate(payment.due_date)}</p>
                      )}
                      {payment.paid_at && (
                        <p className="text-xs text-green-600">Paid {formatDate(payment.paid_at)}</p>
                      )}
                      {payment.status === "pending" && payment.method === "stripe" && (
                        <Button size="sm" variant="brand" className="w-full" asChild>
                          <a href={`/api/payments/checkout?payment_id=${payment.id}`}>
                            <CreditCard className="h-3 w-3" /> Pay now
                          </a>
                        </Button>
                      )}
                      {payment.status === "pending" && payment.method === "bank_transfer" && (
                        <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1.5">Bank transfer — contact us to get account details</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
