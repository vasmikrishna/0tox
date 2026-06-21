import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { extractProjectAssets, normalizeProjectAssets } from "@/lib/project-assets"
import { defaultStageTemplatesFor } from "@/lib/stage-template-defaults"
import { formatDate } from "@/lib/utils"
import { AdminProjectActions, AdminProjectStages, AdminProjectPayments, AdminProjectNotes } from "./actions"
import { AdminProjectAssignments } from "./assignments"
import type { Project, Stage, Payment, IntakeResponse, DeliverableFile, User, StageTemplate } from "@/types"
import { MOCK_PROJECTS, MOCK_STAGES, MOCK_PAYMENTS, MOCK_INTAKE_RESPONSES } from "@/lib/mock-data"
import { FolderOpen } from "lucide-react"

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

  let project: (Project & { users?: Pick<User, "name" | "email"> }) | null = null
  let stages: (Stage & { deliverable_files: DeliverableFile[] })[] = []
  let stageTemplates: StageTemplate[] = []
  let payments: Payment[] = []
  let responses: (IntakeResponse & { intake_questions?: { label: string } })[] = []

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()

    const { data: p } = await supabase.from("projects").select("*, users(name, email)").eq("id", id).single()
    project = p as typeof project
    if (!project) notFound()
    const projectTier = (project as Project).service_tier

    const [{ data: s }, { data: templates }, { data: pay }, { data: r }] = await Promise.all([
      supabase.from("stages").select("*, deliverable_files(*)").eq("project_id", id).order("sort_order"),
      supabase.from("stage_templates").select("*").eq("service_tier", projectTier).order("sort_order"),
      supabase.from("payments").select("*").eq("project_id", id).order("created_at"),
      supabase.from("intake_responses").select("*, intake_questions(label, type)").eq("project_id", id),
    ])
    stages = (s ?? []) as unknown as (Stage & { deliverable_files: DeliverableFile[] })[]
    stageTemplates = ((templates ?? []) as unknown as StageTemplate[])
    if (!stageTemplates.length) stageTemplates = defaultStageTemplatesFor(projectTier)
    payments = (pay ?? []) as unknown as Payment[]
    responses = (r ?? []) as unknown as (IntakeResponse & { intake_questions?: { label: string } })[]
  } else {
    const found = MOCK_PROJECTS.find(p => p.id === id) ?? MOCK_PROJECTS[1]
    project = { ...found, users: found.client }
    stages = MOCK_STAGES.filter(s => s.project_id === found.id)
    payments = MOCK_PAYMENTS.filter(p => p.project_id === found.id)
    responses = MOCK_INTAKE_RESPONSES.filter(r => r.project_id === found.id).map(r => ({
      ...r,
      intake_questions: r.intake_questions,
    }))
  }

  if (!project) notFound()

  const status = statusConfig[project.status as keyof typeof statusConfig]
  const client = project.users
  const projectAssets = extractProjectAssets(project.admin_notes)
  const deliverableCount = stages.reduce((sum, s) => sum + (s.deliverable_files?.length ?? 0), 0)
  const linkCount = normalizeProjectAssets(project.project_links?.length ? project.project_links : projectAssets).length
  const assetCount = linkCount + deliverableCount

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
              {responses.length ? responses.map((r) => (
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
          <AdminProjectStages projectId={id} serviceTier={project.service_tier} stages={stages} templates={stageTemplates} />
        </div>

        {/* Right column — payments + notes */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Project assets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Manage folders, files, links, and project docs in the dedicated asset workspace.
              </p>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-muted-foreground">{assetCount} asset{assetCount === 1 ? "" : "s"}</span>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/projects/${id}/assets`}>
                    <FolderOpen className="h-3.5 w-3.5" /> Open assets
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <AdminProjectPayments projectId={id} payments={payments} />

          <AdminProjectAssignments projectId={id} />

          {/* Admin notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Internal notes</CardTitle></CardHeader>
            <CardContent>
              <AdminProjectNotes projectId={id} initialNotes={project.admin_notes ?? ""} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/projects/${id}/changelog`}>View changelog</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
