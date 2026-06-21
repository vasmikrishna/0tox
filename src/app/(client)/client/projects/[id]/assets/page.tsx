import { notFound } from "next/navigation"
import { getSession } from "@/lib/session"
import { ProjectAssetsWorkspace } from "@/components/project-assets-workspace"
import { extractProjectAssets, visibleProjectAssets, mergeStageDeliverables } from "@/lib/project-assets"
import type { Project, Stage, DeliverableFile } from "@/types"
import { MOCK_PROJECTS, MOCK_STAGES } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ClientProjectAssetsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ folder_id?: string }>
}) {
  const { id } = await params
  const { folder_id } = await searchParams
  let project: Project | null = null
  let stages: (Stage & { deliverable_files?: DeliverableFile[] })[] = []

  if (supabaseConfigured()) {
    try {
      const session = await getSession()
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data: dbUser } = await supabase.from("users").select("id").eq("email", session?.email ?? "").single()
      if (!dbUser) notFound()

      const { data } = await supabase.from("projects").select("*").eq("id", id).eq("client_id", dbUser.id).single()
      project = data as unknown as Project | null

      if (project) {
        const { data: s } = await supabase
          .from("stages")
          .select("*, deliverable_files(*)")
          .eq("project_id", id)
          .eq("visible_to_client", true)
          .order("sort_order")
        stages = (s ?? []) as unknown as (Stage & { deliverable_files: DeliverableFile[] })[]
      }
    } catch {
      notFound()
    }
  } else {
    project = MOCK_PROJECTS.find(item => item.id === id) ?? MOCK_PROJECTS[1]
    stages = MOCK_STAGES.filter(item => item.project_id === id && item.visible_to_client)
  }

  if (!project) notFound()

  const rawAssets = project.project_links?.length ? project.project_links : extractProjectAssets(project.admin_notes)
  const mergedAssets = mergeStageDeliverables(rawAssets, stages)
  const assets = visibleProjectAssets(mergedAssets)

  return <ProjectAssetsWorkspace project={{ ...project, project_links: assets }} mode="client" initialFolderId={folder_id} />
}

