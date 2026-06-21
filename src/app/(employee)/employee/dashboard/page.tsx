import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getSession } from "@/lib/session"
import type { Project } from "@/types"

const statusConfig = {
  intake:    { label: "Submitted",   variant: "default" as const },
  review:    { label: "In Review",   variant: "warning" as const },
  active:    { label: "In Progress", variant: "brand" as const },
  completed: { label: "Completed",   variant: "success" as const },
  cancelled: { label: "Cancelled",   variant: "destructive" as const },
}

const tierLabel: Record<string, string> = { starter: "Starter", standard: "Standard", pro: "Pro" }

export default async function EmployeeDashboard() {
  const session = await getSession()
  const userName = session?.name ?? "there"

  let projects: Project[] = []

  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseConfigured && session) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from("project_assignments")
        .select("projects(*)")
        .eq("employee_id", session.id)
        .order("assigned_at", { ascending: false })

      projects = (data ?? [])
        .map((row: any) => row.projects)
        .filter(Boolean) as Project[]
    } catch {}
  }

  const active = projects.filter(p => p.status === "active").length
  const completed = projects.filter(p => p.status === "completed").length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {userName.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">Projects you&apos;ve been assigned to</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{projects.length}</p><p className="text-sm text-muted-foreground mt-1">Assigned projects</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{active}</p><p className="text-sm text-muted-foreground mt-1">In progress</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{completed}</p><p className="text-sm text-muted-foreground mt-1">Completed</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Assigned Projects</h2>
        {!projects.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No projects assigned yet. An admin will assign you to projects.</p>
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
                        <span className="text-xs text-muted-foreground">{tierLabel[project.service_tier] ?? project.service_tier} tier</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">Created {formatDate(project.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/employee/projects/${project.id}`}><ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
