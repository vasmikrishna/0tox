import { notFound } from "next/navigation"
import { getSession } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import Link from "next/link"
import { AdminProjectStages } from "@/app/(admin)/admin/projects/[id]/actions"
import { defaultStageTemplatesFor } from "@/lib/stage-template-defaults"
import { extractProjectAssets, normalizeProjectAssets } from "@/lib/project-assets"
import type { Project, Stage, DeliverableFile, StageTemplate } from "@/types"

const statusConfig = {
  intake:    { label: "Submitted",   variant: "default" as const },
  review:    { label: "In Review",   variant: "warning" as const },
  active:    { label: "In Progress", variant: "brand" as const },
  completed: { label: "Completed",   variant: "success" as const },
  cancelled: { label: "Cancelled",   variant: "destructive" as const },
}

const tierLabel: Record<string, string> = { starter: "Starter", standard: "Standard", pro: "Pro" }

export default async function EmployeeProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  let project: Project | null = null
  let stages: (Stage & { deliverable_files: DeliverableFile[] })[] = []
  let stageTemplates: StageTemplate[] = []

  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseConfigured || !session) notFound()

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()

    // Verify the employee is assigned to this project
    const { data: assignment } = await (supabase as any)
      .from("project_assignments")
      .select("id")
      .eq("project_id", id)
      .eq("employee_id", session.id)
      .single()

    if (!assignment) notFound()

    const { data: p } = await (supabase as any)
      .from("projects")
      .select("*, users!projects_client_id_fkey(name, email)")
      .eq("id", id)
      .single()

    project = p as Project | null
    if (!project) notFound()

    const [{ data: s }, { data: templates }] = await Promise.all([
      supabase
        .from("stages")
        .select("*, deliverable_files(*)")
        .eq("project_id", id)
        .order("sort_order"),
      supabase
        .from("stage_templates")
        .select("*")
        .eq("service_tier", project.service_tier)
        .order("sort_order")
    ])

    stages = (s ?? []) as unknown as (Stage & { deliverable_files: DeliverableFile[] })[]
    stageTemplates = (templates ?? []) as unknown as StageTemplate[]
    if (!stageTemplates.length) {
      stageTemplates = defaultStageTemplatesFor(project.service_tier)
    }
  } catch {
    notFound()
  }

  if (!project) notFound()

  const status = statusConfig[project.status as keyof typeof statusConfig]
  const client = (project as any).users

  const projectAssets = extractProjectAssets(project.admin_notes)
  const deliverableCount = stages.reduce((sum, s) => sum + (s.deliverable_files?.length ?? 0), 0)
  const linkCount = normalizeProjectAssets(project.project_links?.length ? project.project_links : projectAssets).length
  const assetCount = linkCount + deliverableCount

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {client ? `${client.name} · ` : ""}
          {tierLabel[project.service_tier] ?? project.service_tier} tier · Created {formatDate(project.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — stages */}
        <div className="lg:col-span-3 space-y-6">
          <AdminProjectStages projectId={id} serviceTier={project.service_tier} stages={stages} templates={stageTemplates} />
        </div>

        {/* Right column — assets */}
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
                  <Link href={`/employee/projects/${id}/assets`}>
                    <FolderOpen className="h-3.5 w-3.5" /> Open assets
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
