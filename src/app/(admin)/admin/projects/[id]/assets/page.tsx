import { notFound } from "next/navigation"
import { ProjectAssetsWorkspace } from "@/components/project-assets-workspace"
import { extractProjectAssets, mergeStageDeliverables } from "@/lib/project-assets"
import type { Project, User, Stage, DeliverableFile } from "@/types"
import { MOCK_PROJECTS, MOCK_STAGES } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminProjectAssetsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ folder_id?: string }>
}) {
  const { id } = await params
  const { folder_id } = await searchParams
  let project: (Project & { users?: Pick<User, "name" | "email"> }) | null = null
  let stages: (Stage & { deliverable_files?: DeliverableFile[] })[] = []

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const { data } = await supabase.from("projects").select("*, users(name, email)").eq("id", id).single()
    project = data as typeof project

    if (project) {
      const { data: s } = await supabase
        .from("stages")
        .select("*, deliverable_files(*)")
        .eq("project_id", id)
        .order("sort_order")
      stages = (s ?? []) as unknown as (Stage & { deliverable_files: DeliverableFile[] })[]
    }
  } else {
    const found = MOCK_PROJECTS.find(item => item.id === id) ?? MOCK_PROJECTS[1]
    project = { ...found, users: found.client }
    stages = MOCK_STAGES.filter(item => item.project_id === id)
  }

  if (!project) notFound()

  const rawAssets = extractProjectAssets(project.admin_notes)
  project = { ...project, project_links: mergeStageDeliverables(rawAssets, stages) }

  return <ProjectAssetsWorkspace project={project} mode="admin" initialFolderId={folder_id} />
}

