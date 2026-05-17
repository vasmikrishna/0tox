import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { AdminProjectActions, AdminProjectStages, AdminProjectPayments, AdminProjectNotes } from "./actions"
import type { Stage, Payment, IntakeResponse, DeliverableFile } from "@/types"
import { MOCK_PROJECTS, MOCK_STAGES, MOCK_PAYMENTS, MOCK_INTAKE_RESPONSES } from "@/lib/mock-data"

const statusConfig = {
  intake:    { label: "Submitted",   variant: "default" as const },
  review:    { label: "In Review",   variant: "warning" as const },
  active:    { label: "In Progress", variant: "brand" as const },
  completed: { label: "Completed",   variant: "success" as const },
  cancelled: { label: "Cancelled",   variant: "destructive" as const },
}

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let project: any = null
  let stages: any[] = []
  let payments: any[] = []
  let responses: any[] = []

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()

    const { data: p } = await supabase.from("projects").select("*, users(name, email)").eq("id", id).single()
    project = p
    if (!project) notFound()

    const [{ data: s }, { data: pay }, { data: r }] = await Promise.all([
      supabase.from("stages").select("*, deliverable_files(*)").eq("project_id", id).order("sort_order"),
      supabase.from("payments").select("*").eq("project_id", id).order("created_at"),
      supabase.from("intake_responses").select("*, intake_questions(label, type)").eq("project_id", id),
    ])
    stages = s ?? []
    payments = pay ?? []
    responses = r ?? []
  } else {
    const found = MOCK_PROJECTS.find(p => p.id === id) ?? MOCK_PROJECTS[1]
    project = { ...found, users: found.client }
    stages = MOCK_STAGES.filter(s => s.project_id === project.id)
    payments = MOCK_PAYMENTS.filter(p => p.project_id === project.id)
    responses = MOCK_INTAKE_RESPONSES.filter(r => r.project_id === project.id).map(r => ({
      ...r,
      intake_questions: r.intake_questions,
    }))
  }

  const status = statusConfig[project.status as keyof typeof statusConfig]
  const client = project.users

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {client?.name} ({client?.email}) · {project.service_tier} tier · {formatDate(project.created_at)}
          </p>
        </div>
        <AdminProjectActions project={project} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — stages + intake */}
        <div className="lg:col-span-3 space-y-6">

          {/* Intake Answers */}
          <Card>
            <CardHeader><CardTitle className="text-base">Client intake answers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {responses.length ? responses.map((r: IntakeResponse & { intake_questions: { label: string } }) => (
                <div key={r.id} className="text-sm border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-muted-foreground">{r.intake_questions?.label}</p>
                  <p className="font-medium mt-0.5 whitespace-pre-wrap">{r.answer || <span className="text-muted-foreground italic">Not answered</span>}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No intake responses yet</p>
              )}
            </CardContent>
          </Card>

          {/* Stages */}
          <AdminProjectStages projectId={id} stages={stages} />
        </div>

        {/* Right column — payments + notes */}
        <div className="lg:col-span-2 space-y-6">
          <AdminProjectPayments projectId={id} payments={payments} />

          {/* Admin notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Internal notes</CardTitle></CardHeader>
            <CardContent>
              <AdminProjectNotes projectId={id} initialNotes={project.admin_notes ?? ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
