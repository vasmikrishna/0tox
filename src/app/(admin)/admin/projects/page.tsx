import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ArrowRight, Plus } from "lucide-react"
import { MOCK_PROJECTS } from "@/lib/mock-data"

const statusConfig: Record<string, { label: string; variant: "default"|"warning"|"brand"|"success"|"destructive" }> = {
  intake:    { label: "Submitted",   variant: "default" },
  review:    { label: "In Review",   variant: "warning" },
  active:    { label: "In Progress", variant: "brand" },
  completed: { label: "Completed",   variant: "success" },
  cancelled: { label: "Cancelled",   variant: "destructive" },
}

const tierLabel: Record<string, string> = { starter: "Starter", standard: "Standard", pro: "Pro" }

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
        <div className="space-y-2">
          {projects.map((project) => {
            const status = statusConfig[project.status]
            return (
              <Card key={project.id} className="hover:border-foreground/20 transition-colors">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{project.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{project.users?.name}</span><span>·</span>
                      <span>{tierLabel[project.service_tier] ?? project.service_tier}</span><span>·</span>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={status?.variant}>{status?.label}</Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/projects/${project.id}`}>Manage <ArrowRight className="h-3 w-3" /></Link>
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
