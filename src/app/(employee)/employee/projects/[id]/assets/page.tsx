import { notFound } from "next/navigation"
import { getSession } from "@/lib/session"
import { ProjectAssetsWorkspace } from "@/components/project-assets-workspace"
import { extractProjectAssets, mergeStageDeliverables } from "@/lib/project-assets"
import type { Project, Stage, DeliverableFile } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function EmployeeProjectAssetsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ folder_id?: string }>
}) {
  const { id } = await params
  const { folder_id } = await searchParams
  const session = await getSession()

  if (!session) notFound()

  let project: Project | null = null
  let stages: (Stage & { deliverable_files: DeliverableFile[] })[] = []

  if (supabaseConfigured()) {
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

      const { data: p } = await supabase
        .from("projects")
        .select("*, users(name, email)")
        .eq("id", id)
        .single()

      project = p as unknown as Project | null

      if (project) {
        const { data: s } = await supabase
          .from("stages")
          .select("*, deliverable_files(*)")
          .eq("project_id", id)
          .order("sort_order")
        stages = (s ?? []) as unknown as (Stage & { deliverable_files: DeliverableFile[] })[]
      }
    } catch {
      notFound()
    }
  } else {
    notFound()
  }

  if (!project) notFound()

  const rawAssets = extractProjectAssets(project.admin_notes)
  project = { ...project, project_links: mergeStageDeliverables(rawAssets, stages) }

  return <ProjectAssetsWorkspace project={project} mode="employee" initialFolderId={folder_id} />
}
