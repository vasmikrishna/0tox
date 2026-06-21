"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { stripProjectAssets, extractProjectAssets, composeProjectNotes } from "@/lib/project-assets"
import { createClient } from "@/lib/supabase/client"

const JSON_HEADERS = { "Content-Type": "application/json" }
import { CheckCircle2, Circle, Loader2, Plus, Eye, EyeOff, Upload, Sparkles, Pencil, Trash2, FolderOpen } from "lucide-react"
import type { Stage, Payment, DeliverableFile, Project, ProjectStatus, PaymentMethod, ServiceTier, StageTemplate } from "@/types"

const PROJECT_STATUSES = ["intake", "review", "active", "completed", "cancelled"] as const

// ── Status changer ────────────────────────────────────────────────────────
export function AdminProjectActions({ project }: { project: Project }) {
  const [status, setStatus] = useState(project.status)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function updateStatus(newStatus: ProjectStatus) {
    setSaving(true)
    await fetch(`/api/admin/projects/${project.id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ status: newStatus }) })
    setStatus(newStatus)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={e => updateStatus(e.target.value as ProjectStatus)}
        disabled={saving}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring capitalize"
      >
        {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
    </div>
  )
}

// ── Stage management ──────────────────────────────────────────────────────
export function AdminProjectStages({ projectId, serviceTier, stages, templates }: { projectId: string; serviceTier: ServiceTier; stages: (Stage & { deliverable_files: DeliverableFile[] })[]; templates: StageTemplate[] }) {
  const [items, setItems] = useState(stages)
  const [adding, setAdding] = useState(false)
  const [customizingTemplate, setCustomizingTemplate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [templateDraft, setTemplateDraft] = useState(() => templates.map(template => ({ name: template.name, description: template.description ?? "" })))
  const [uploadingStage, setUploadingStage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function addStage() {
    if (!newName) return
    const res = await fetch(`/api/admin/projects/${projectId}/stages`, {
      method: "POST", headers: JSON_HEADERS,
      body: JSON.stringify({ name: newName, description: newDesc, sort_order: items.length + 1 }),
    })
    const { stage: data } = await res.json().catch(() => ({ stage: null }))
    if (res.ok && data) {
      setItems(prev => [...prev, data as Stage & { deliverable_files: DeliverableFile[] }])
      setNewName(""); setNewDesc(""); setAdding(false)
    }
  }

  async function applyTemplate(stagesToApply = templateDraft) {
    const usableStages = stagesToApply
      .map((stage, index) => ({ name: stage.name.trim(), description: stage.description.trim() || null, sort_order: index + 1 }))
      .filter(stage => stage.name)

    if (!usableStages.length || items.length > 0) return

    const res = await fetch(`/api/admin/projects/${projectId}/stages`, {
      method: "POST", headers: JSON_HEADERS,
      body: JSON.stringify({ stages: usableStages }),
    })
    const { stages: data } = await res.json().catch(() => ({ stages: null }))
    if (res.ok && data) {
      setItems(data as (Stage & { deliverable_files: DeliverableFile[] })[])
      setCustomizingTemplate(false)
      router.refresh()
    }
  }

  function updateTemplateDraft(index: number, updates: Partial<{ name: string; description: string }>) {
    setTemplateDraft(prev => prev.map((stage, stageIndex) => stageIndex === index ? { ...stage, ...updates } : stage))
  }

  function addTemplateDraftStage() {
    setTemplateDraft(prev => [...prev, { name: "", description: "" }])
  }

  function removeTemplateDraftStage(index: number) {
    setTemplateDraft(prev => prev.filter((_, stageIndex) => stageIndex !== index))
  }

  async function updateStage(stageId: string, updates: Partial<Stage>) {
    await fetch(`/api/admin/projects/${projectId}/stages/${stageId}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(updates) })
    setItems(prev => prev.map(s => s.id === stageId ? { ...s, ...updates } : s))
    router.refresh()
  }

  function editStage(stage: Stage) {
    setEditingStageId(stage.id)
    setEditName(stage.name)
    setEditDesc(stage.description ?? "")
  }

  async function saveStageDetails(stageId: string) {
    if (!editName.trim()) return
    await updateStage(stageId, { name: editName.trim(), description: editDesc.trim() })
    setEditingStageId(null)
    setEditName("")
    setEditDesc("")
  }

  async function deleteStage(stageId: string) {
    const stage = items.find(s => s.id === stageId)
    if (!stage) return

    // 1. If there are deliverables, preserve them by converting to standard assets
    if (stage.deliverable_files && stage.deliverable_files.length > 0) {
      const { data: project } = await supabase
        .from("projects")
        .select("admin_notes, project_links")
        .eq("id", projectId)
        .single()

      if (project) {
        const regularAssets = extractProjectAssets(project.admin_notes)
        const newFolderId = `folder-${Date.now()}`
        const preservedFolder = {
          id: newFolderId,
          label: stage.name,
          url: "",
          type: "folder" as const,
          kind: "folder" as const,
          folder_id: "",
          visible_to_client: stage.visible_to_client,
          created_at: new Date().toISOString()
        }
        const preservedFiles = stage.deliverable_files.map(file => ({
          id: file.id,
          label: file.name,
          url: file.url,
          type: "file" as const,
          kind: "file" as const,
          folder_id: newFolderId,
          visible_to_client: stage.visible_to_client,
          size: file.size,
          created_at: file.uploaded_at
        }))

        const nextAssets = [preservedFolder, ...preservedFiles, ...regularAssets]
        await supabase
          .from("projects")
          .update({
            admin_notes: composeProjectNotes(project.admin_notes, nextAssets),
            project_links: nextAssets
          })
          .eq("id", projectId)
      }
    }

    // 2. Delete the stage from database
    await supabase.from("stages").delete().eq("id", stageId)
    setItems(prev => prev.filter(s => s.id !== stageId))
    void fetch("/api/audit/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, action: "stage.deleted", entityType: "stage", entityId: stageId, changes: { name: { old: stage?.name, new: null } } }) })
    router.refresh()
  }


  async function markComplete(stageId: string) {
    const updates = { status: "completed" as const, completed_at: new Date().toISOString(), visible_to_client: true }
    await updateStage(stageId, updates)
  }

  async function uploadDeliverable(stageId: string, file: File | null) {
    if (!file) return

    setUploadingStage(stageId)
    const formData = new FormData()
    formData.append("stageId", stageId)
    formData.append("file", file)

    const response = await fetch("/api/resources/upload", { method: "POST", body: formData })
    const payload = await response.json()
    if (response.ok && payload.file) {
      setItems(prev => prev.map(stage => stage.id === stageId
        ? { ...stage, deliverable_files: [...(stage.deliverable_files ?? []), payload.file] }
        : stage
      ))
      router.refresh()
    }
    setUploadingStage(null)
  }

  const stageIcon = (status: string) => ({
    pending: <Circle className="h-4 w-4 text-muted-foreground" />,
    in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  }[status] ?? <Circle className="h-4 w-4" />)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Stages</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3" /> Add stage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!items.length && !customizingTemplate && templates.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium capitalize">{serviceTier} stage template</p>
                <p className="text-xs text-muted-foreground">{templates.length} configured stages. Apply once, then customize the copied project stages below.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCustomizingTemplate(true)}>Customize first</Button>
                <Button size="sm" onClick={() => applyTemplate()}><Sparkles className="h-3.5 w-3.5" /> Apply template</Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((template, index) => (
                <div key={template.id} className="rounded-md border border-border px-3 py-2">
                  <p className="text-sm font-medium">{index + 1}. {template.name}</p>
                  {template.description && <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length > 0 && templates.length > 0 && (
          <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            A template has been selected or custom stages already exist for this project. Edit, delete, hide, or add stages below without changing the admin template.
          </p>
        )}

        {!items.length && customizingTemplate && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Customize template for this project</p>
              <p className="text-xs text-muted-foreground">These changes are copied only into this project. The admin template stays unchanged.</p>
            </div>
            <div className="space-y-2">
              {templateDraft.map((stage, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_1.4fr_auto]">
                  <Input value={stage.name} onChange={event => updateTemplateDraft(index, { name: event.target.value })} placeholder="Stage name" />
                  <Input value={stage.description} onChange={event => updateTemplateDraft(index, { description: event.target.value })} placeholder="Description" />
                  <Button size="sm" variant="ghost" onClick={() => removeTemplateDraftStage(index)}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={addTemplateDraftStage}><Plus className="h-3.5 w-3.5" /> Add stage</Button>
              <Button size="sm" onClick={() => applyTemplate(templateDraft)}>Use this template</Button>
              <Button size="sm" variant="ghost" onClick={() => setCustomizingTemplate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {items.map((stage) => (
          <div key={stage.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {stageIcon(stage.status)}
              {editingStageId === stage.id ? (
                <div className="flex-1 space-y-2">
                  <Input value={editName} onChange={event => setEditName(event.target.value)} placeholder="Stage name" />
                  <Input value={editDesc} onChange={event => setEditDesc(event.target.value)} placeholder="Description" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveStageDetails(stage.id)} disabled={!editName.trim()}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingStageId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className="font-medium text-sm">{stage.name}</p>
                  {stage.description && <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>}
                  {typeof window !== "undefined" && (
                    <Link
                      href={
                        window.location.pathname.startsWith("/employee")
                          ? `/employee/projects/${projectId}/assets?folder_id=${stage.id}`
                          : `/admin/projects/${projectId}/assets?folder_id=${stage.id}`
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline mt-1 bg-brand/5 border border-brand/10 hover:bg-brand/10 transition rounded px-2 py-0.5 w-fit"
                    >
                      <FolderOpen className="h-3 w-3 text-brand" />
                      View stage folder in assets
                    </Link>
                  )}
                </div>
              )}
              <button
                onClick={() => updateStage(stage.id, { visible_to_client: !stage.visible_to_client })}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={stage.visible_to_client ? "Hide from client" : "Show to client"}
              >
                {stage.visible_to_client ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              {editingStageId !== stage.id && (
                <button onClick={() => editStage(stage)} className="text-muted-foreground hover:text-foreground transition-colors" title="Edit stage">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {editingStageId !== stage.id && (
                <button onClick={() => deleteStage(stage.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete stage">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {stage.status !== "completed" && (
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => markComplete(stage.id)}>Done</Button>
              )}
              {stage.status === "pending" && (
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => updateStage(stage.id, { status: "in_progress" })}>Start</Button>
              )}
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Badge variant={stage.visible_to_client ? "success" : "default"} className="text-xs">
                {stage.visible_to_client ? "Visible to client" : "Hidden"}
              </Badge>
              {stage.deliverable_files?.length > 0 && (
                <span className="text-xs text-muted-foreground">{stage.deliverable_files.length} file(s)</span>
              )}
            </div>
            {stage.deliverable_files?.length > 0 && (
              <div className="space-y-1 pl-6">
                {stage.deliverable_files.map(file => (
                  <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground">
                    {file.name}
                  </a>
                ))}
              </div>
            )}
            <label className="ml-6 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              {uploadingStage === stage.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Upload deliverable
              <input
                type="file"
                className="sr-only"
                disabled={uploadingStage === stage.id}
                onChange={event => uploadDeliverable(stage.id, event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        ))}

        {adding && (
          <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
            <Input placeholder="Stage name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={addStage} disabled={!newName}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {!items.length && !adding && !customizingTemplate && !templates.length && (
          <p className="text-sm text-muted-foreground text-center py-4">No stages yet. Configure a stage template in Admin Config or add stages manually.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Payment management ────────────────────────────────────────────────────
export function AdminProjectPayments({ projectId, payments }: { projectId: string; payments: Payment[] }) {
  const [items, setItems] = useState(payments)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{ label: string; amount: string; method: PaymentMethod; due_date: string }>({ label: "", amount: "", method: "stripe", due_date: "" })
  const supabase = createClient()

  async function addPayment() {
    if (!form.label || !form.amount) return
    const { data } = await supabase.from("payments").insert({
      project_id: projectId, label: form.label, amount: parseFloat(form.amount),
      method: form.method, due_date: form.due_date || null, status: "pending"
    }).select().single()
    if (data) {
      setItems(prev => [...prev, data as unknown as Payment])
      setForm({ label: "", amount: "", method: "stripe", due_date: "" }); setAdding(false)
      void fetch("/api/audit/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, action: "payment.created", entityType: "payment", entityId: (data as any).id, changes: { label: { old: null, new: form.label }, amount: { old: null, new: form.amount } } }) })
    }
  }

  async function markPaid(paymentId: string) {
    const payment = items.find(p => p.id === paymentId)
    await supabase.from("payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", paymentId)
    setItems(prev => prev.map(p => p.id === paymentId ? { ...p, status: "paid" as const, paid_at: new Date().toISOString() } : p))
    void fetch("/api/audit/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, action: "payment.marked_paid", entityType: "payment", entityId: paymentId, changes: { status: { old: payment?.status, new: "paid" } } }) })
  }

  const paymentBadge = (status: Payment["status"]) => ({ pending: "warning", paid: "success", overdue: "destructive" } as const)[status] ?? "default"

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Payments</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{payment.label}</p>
              <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
              {payment.due_date && <p className="text-xs text-muted-foreground">Due {formatDate(payment.due_date)}</p>}
              {payment.paid_at && <p className="text-xs text-green-600">Paid {formatDate(payment.paid_at)}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={paymentBadge(payment.status)}>{payment.status}</Badge>
              {payment.status !== "paid" && (
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markPaid(payment.id)}>Mark paid</Button>
              )}
            </div>
          </div>
        ))}

        {adding && (
          <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
            <Input placeholder="Label (e.g. 50% Deposit)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
            <Input type="number" placeholder="Amount (USD)" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value as PaymentMethod }))}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none">
              <option value="stripe">Stripe (card)</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
            <Input type="date" placeholder="Due date (optional)" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={addPayment} disabled={!form.label || !form.amount}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}
        {!items.length && !adding && <p className="text-sm text-muted-foreground text-center py-2">No payments yet</p>}
      </CardContent>
    </Card>
  )
}

// ── Notes ─────────────────────────────────────────────────────────────────
export function AdminProjectNotes({ projectId, initialNotes }: { projectId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(stripProjectAssets(initialNotes))
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function save() {
    setSaving(true)
    const { data: project } = await supabase.from("projects").select("admin_notes").eq("id", projectId).single()
    await supabase.from("projects").update({ admin_notes: composeProjectNotes(notes, extractProjectAssets(project?.admin_notes as string | null)) }).eq("id", projectId)
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Internal notes — not visible to client"
        className="min-h-[120px]"
      />
      <Button size="sm" variant="outline" loading={saving} onClick={save}>Save notes</Button>
    </div>
  )
}
