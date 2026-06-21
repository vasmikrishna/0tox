import { notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { extractProjectAssets, visibleProjectAssets } from "@/lib/project-assets"
import { Download, CheckCircle2, Circle, Loader2, CreditCard, ExternalLink, FolderOpen } from "lucide-react"
import type { Project, Stage, Payment, DeliverableFile } from "@/types"
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

function formatLogMessage(log: any) {
  const emailLabel = log.user_email ? `by ${log.user_email.split("@")[0]}` : ""
  
  switch (log.action) {
    case "project.created":
      return `Project created`
    case "project.status_changed": {
      const status = log.changes?.status?.new || "updated"
      const displayStatus = status === "intake" ? "submitted" : status === "active" ? "in progress" : status
      return `Project status changed to ${displayStatus} ${emailLabel}`
    }
    case "project.updated":
      return `Project details updated ${emailLabel}`
    case "stage.created":
      return `New stage added: "${log.changes?.name?.new || "Untitled"}" ${emailLabel}`
    case "stage.updated": {
      const name = log.changes?.name?.new || log.changes?.name?.old || "Stage"
      const status = log.changes?.status?.new
      if (status) {
        return `Stage "${name}" status updated to ${status.replace("_", " ")} ${emailLabel}`
      }
      return `Stage "${name}" updated ${emailLabel}`
    }
    case "stage.deleted":
      return `Stage "${log.changes?.name?.old || "Stage"}" deleted ${emailLabel}`
    case "stage.completed":
      return `Stage completed: "${log.changes?.name?.new || log.changes?.name?.old || "Stage"}"`
    case "stage.started":
      return `Stage started: "${log.changes?.name?.new || log.changes?.name?.old || "Stage"}"`
    case "deliverable.uploaded":
      return `Deliverable uploaded: "${log.changes?.name?.new || "file"}" ${emailLabel}`
    case "deliverable.deleted":
      return `Deliverable removed: "${log.changes?.name?.old || "file"}" ${emailLabel}`
    default:
      return `${log.action.replace(".", " ")} ${emailLabel}`
  }
}

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let project: Project | null = null
  let stages: (Stage & { deliverable_files: DeliverableFile[] })[] = []
  let payments: Payment[] = []
  let logs: any[] = []

  if (supabaseConfigured()) {
    try {
      const session = await getSession()
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data: dbUser } = await supabase.from("users").select("id").eq("email", session?.email ?? "").single()
      if (!dbUser) notFound()

      const { data: p } = await supabase.from("projects").select("*").eq("id", id).eq("client_id", dbUser.id).single()
      project = p as unknown as Project | null
      if (!project) notFound()

      const [{ data: s }, { data: pay }, { data: logData }] = await Promise.all([
        supabase.from("stages").select("*, deliverable_files(*)").eq("project_id", id).eq("visible_to_client", true).order("sort_order"),
        supabase.from("payments").select("*").eq("project_id", id).order("created_at"),
        supabase.from("audit_logs").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(20)
      ])
      stages = (s ?? []) as unknown as (Stage & { deliverable_files: DeliverableFile[] })[]
      payments = (pay ?? []) as unknown as Payment[]
      logs = logData ?? []
    } catch { notFound() }
  } else {
    const found = MOCK_PROJECTS.find(p => p.id === id) ?? MOCK_PROJECTS[1]
    project = found
    stages = MOCK_STAGES.filter(s => s.project_id === found.id && s.visible_to_client)
    payments = MOCK_PAYMENTS.filter(p => p.project_id === found.id)
    logs = [
      {
        id: "mock-log-1",
        project_id: id,
        action: "project.created",
        user_email: "ckrishna@startensystems.com",
        created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        id: "mock-log-2",
        project_id: id,
        action: "project.status_changed",
        user_email: "ckrishna@startensystems.com",
        changes: { status: { new: "active" } },
        created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      }
    ]
  }

  if (!project) notFound()

  const status = statusConfig[project.status as keyof typeof statusConfig]
  const tierLabel: Record<string, string> = { starter: "Starter", standard: "Standard", pro: "Pro" }
  const deliverableCount = stages.reduce((sum, s) => sum + (s.deliverable_files?.length ?? 0), 0)
  const assetCount = visibleProjectAssets(project.project_links?.length ? project.project_links : extractProjectAssets(project.admin_notes)).length + deliverableCount

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {tierLabel[project.service_tier] ?? project.service_tier} tier · Submitted {formatDate(project.created_at)}
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
        {/* Stages & Activity Feed */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Project Stages Card */}
          <div className="space-y-4">
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
                          <Link
                            href={`/client/projects/${project.id}/assets?folder_id=${stage.id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline mt-2.5 bg-brand/5 border border-brand/10 hover:bg-brand/10 transition rounded px-2.5 py-1 w-fit"
                          >
                            <FolderOpen className="h-3 w-3 text-brand" />
                            Open stage folder in assets
                          </Link>
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

          {/* Activity Feed Card */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Project activity</h2>
            <Card>
              <CardContent className="py-5 px-6">
                {!logs?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity logged yet</p>
                ) : (
                  <div className="relative border-l border-border pl-4 space-y-5">
                    {logs.map((log) => (
                      <div key={log.id} className="relative text-sm">
                        {/* Timeline Dot */}
                        <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-border ring-4 ring-background" />
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <p className="font-medium text-foreground">{formatLogMessage(log)}</p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(log.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Payments & Assets */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Project assets</h2>
            <Card>
              <CardContent className="space-y-3 py-4 px-5">
                <p className="text-sm text-muted-foreground">
                  Open the project asset workspace to view files, folders, links, and docs shared with you.
                </p>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-sm text-muted-foreground">{assetCount} asset{assetCount === 1 ? "" : "s"}</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/client/projects/${id}/assets`}>
                      <FolderOpen className="h-3.5 w-3.5" /> Open assets
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

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
