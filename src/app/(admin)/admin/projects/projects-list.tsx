"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { PaginatedList } from "@/components/paginated-list"

const statusConfig: Record<string, { label: string; variant: "default"|"warning"|"brand"|"success"|"destructive" }> = {
  intake:    { label: "Submitted",   variant: "default" },
  review:    { label: "In Review",   variant: "warning" },
  active:    { label: "In Progress", variant: "brand" },
  completed: { label: "Completed",   variant: "success" },
  cancelled: { label: "Cancelled",   variant: "destructive" },
}

const tierLabel: Record<string, string> = { starter: "Starter", standard: "Standard", pro: "Pro" }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProjectsList({ projects }: { projects: any[] }) {
  return (
    <PaginatedList
      items={projects}
      pageSize={10}
      searchPlaceholder="Search projects by title, client, tier, or status..."
      testId="projects"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchText={(p: any) => `${p.title} ${p.users?.name ?? ""} ${p.users?.email ?? ""} ${tierLabel[p.service_tier] ?? p.service_tier} ${statusConfig[p.status]?.label ?? p.status}`}
    >
      {(pageProjects) => (
        <div className="space-y-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {pageProjects.map((project: any) => {
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
    </PaginatedList>
  )
}
