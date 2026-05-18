import { notFound } from "next/navigation"
import { getSession } from "@/lib/session"
import { ProjectAssetsWorkspace } from "@/components/project-assets-workspace"
import { extractProjectAssets, visibleProjectAssets } from "@/lib/project-assets"
import type { Project } from "@/types"
import { MOCK_PROJECTS } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ClientProjectAssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let project: Project | null = null

  if (supabaseConfigured()) {
    try {
      const session = await getSession()
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data: dbUser } = await supabase.from("users").select("id").eq("email", session?.email ?? "").single()
      if (!dbUser) notFound()

      const { data } = await supabase.from("projects").select("*").eq("id", id).eq("client_id", dbUser.id).single()
      project = data as unknown as Project | null
    } catch {
      notFound()
    }
  } else {
    project = MOCK_PROJECTS.find(item => item.id === id) ?? MOCK_PROJECTS[1]
  }

  if (!project) notFound()

  const assets = visibleProjectAssets(project.project_links?.length ? project.project_links : extractProjectAssets(project.admin_notes))

  return <ProjectAssetsWorkspace project={{ ...project, project_links: assets }} mode="client" />
}
