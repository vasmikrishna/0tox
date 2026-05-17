import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getSession } from "@/lib/session"
import { MOCK_PROJECTS } from "@/lib/mock-data"
import type { Project } from "@/types"

const statusConfig = {
  intake:    { label: "Submitted",   variant: "default" as const },
  review:    { label: "In Review",   variant: "warning" as const },
  active:    { label: "In Progress", variant: "brand" as const },
  completed: { label: "Completed",   variant: "success" as const },
  cancelled: { label: "Cancelled",   variant: "destructive" as const },
}
const tierLabel = { starter: "Starter", standard: "Standard", pro: "Pro" }

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ClientProjectsPage() {
  const session = await getSession()
  let projects: Project[] = []

  if (supabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data: dbUser } = await supabase.from("users").select("id").eq("email", session?.email ?? "").single()
      if (dbUser) {
        const { data } = await supabase.from("projects").select("*").eq("client_id", dbUser.id).order("created_at", { ascending: false })
        projects = data ?? []
      }
    } catch {}
  } else {
    projects = MOCK_PROJECTS.filter(p => p.client_id === "u2")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/client/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
        </Button>
      </div>

      {!projects.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No projects yet. Start by telling us what you need.</p>
            <Button asChild variant="brand">
              <Link href="/client/projects/new"><Plus className="h-4 w-4" /> Start a project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project: Project) => {
            const status = statusConfig[project.status]
            return (
              <Card key={project.id} className="hover:border-foreground/20 transition-colors">
                <CardContent className="flex items-center justify-between py-5 px-6">
                  <div>
                    <p className="font-medium">{project.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{tierLabel[project.service_tier]} tier</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">Started {formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/client/projects/${project.id}`}><ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
