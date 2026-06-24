import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MOCK_PROJECTS } from "@/lib/mock-data"
import { ProjectsList } from "./projects-list"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminProjectsPage() {
  let projects: any[] = []
  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const { data } = await supabase.from("projects").select("*, users(name, email)").order("created_at", { ascending: false })
    projects = data ?? []
  } else {
    projects = MOCK_PROJECTS.map(p => ({ ...p, users: p.client }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Projects</h1>
          <p className="text-muted-foreground mt-1">{projects.length} projects total</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/admin/projects/new"><Plus className="h-4 w-4" /> New project</Link>
        </Button>
      </div>
      {!projects.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">No projects yet</p>
            <Button asChild variant="brand" size="sm">
              <Link href="/admin/projects/new"><Plus className="h-4 w-4" /> Create your first project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProjectsList projects={projects} />
      )}
    </div>
  )
}
