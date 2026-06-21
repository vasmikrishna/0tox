"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, FileText, Loader2, User } from "lucide-react"
import type { AuditLog } from "@/types"

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
}

function actionLabel(action: string) {
  const labels: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "brand" }> = {
    "stage.created": { label: "Stage created", variant: "default" },
    "stage.updated": { label: "Stage updated", variant: "brand" },
    "stage.deleted": { label: "Stage deleted", variant: "destructive" },
    "stage.completed": { label: "Stage completed", variant: "success" },
    "stage.started": { label: "Stage started", variant: "brand" },
    "payment.created": { label: "Payment added", variant: "default" },
    "payment.updated": { label: "Payment updated", variant: "warning" },
    "project.updated": { label: "Project updated", variant: "brand" },
    "project.status_changed": { label: "Status changed", variant: "warning" },
    "asset.uploaded": { label: "File uploaded", variant: "default" },
    "asset.deleted": { label: "File deleted", variant: "destructive" },
    "note.updated": { label: "Notes updated", variant: "default" },
    "assignment.created": { label: "Employee assigned", variant: "success" },
    "assignment.deleted": { label: "Employee removed", variant: "destructive" },
  }
  return labels[action] ?? { label: action, variant: "default" as const }
}

function ChangeDetails({ changes }: { changes?: Record<string, { old: unknown; new: unknown }> }) {
  if (!changes || Object.keys(changes).length === 0) return null
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => (
        <div key={field} className="flex flex-wrap items-baseline gap-1 text-xs">
          <span className="font-medium text-muted-foreground">{field}:</span>
          {oldVal != null && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-400 line-through">{String(oldVal)}</span>
          )}
          <span className="text-muted-foreground">&rarr;</span>
          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-400">{String(newVal)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ChangelogPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/projects/${projectId}/changelog`)
        if (!res.ok) {
          setError("Failed to load changelog")
          return
        }
        const data = await res.json()
        setLogs(data.logs ?? [])
      } catch {
        setError("Failed to load changelog")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  const grouped = logs.reduce<Record<string, AuditLog[]>>((acc, log) => {
    const date = formatDate(log.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" /> Back to project
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Project changelog</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && logs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No changes recorded yet.</p>
            <p className="text-xs text-muted-foreground">Changes to stages, payments, and project status will appear here.</p>
          </CardContent>
        </Card>
      )}

      {!loading && Object.entries(grouped).map(([date, dayLogs]) => (
        <div key={date}>
          <div className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-background py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">{date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            {dayLogs.map(log => {
              const { label, variant } = actionLabel(log.action)
              return (
                <Card key={log.id} className="overflow-hidden">
                  <CardContent className="flex items-start gap-4 py-3 px-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={variant} className="text-xs">{label}</Badge>
                        {log.entity_type && (
                          <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                        )}
                      </div>
                      <ChangeDetails changes={log.changes} />
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user_email}
                        </span>
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
