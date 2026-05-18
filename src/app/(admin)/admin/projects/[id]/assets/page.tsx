import { notFound } from "next/navigation"
import { ProjectAssetsWorkspace } from "@/components/project-assets-workspace"
import { extractProjectAssets } from "@/lib/project-assets"
import type { Project, User } from "@/types"
import { MOCK_PROJECTS } from "@/lib/mock-data"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminProjectAssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let project: (Project & { users?: Pick<User, "name" | "email"> }) | null = null

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const { data } = await supabase.from("projects").select("*, users(name, email)").eq("id", id).single()
    project = data as typeof project
  } else {
    const found = MOCK_PROJECTS.find(item => item.id === id) ?? MOCK_PROJECTS[1]
    project = { ...found, users: found.client }
  }

  if (!project) notFound()

  project = { ...project, project_links: extractProjectAssets(project.admin_notes) }

  return <ProjectAssetsWorkspace project={project} mode="admin" />
}
