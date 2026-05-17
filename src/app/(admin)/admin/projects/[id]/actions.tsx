"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Loader2, Plus, Eye, EyeOff, Upload, Trash2 } from "lucide-react"
import type { Stage, Payment, DeliverableFile } from "@/types"

const PROJECT_STATUSES = ["intake", "review", "active", "completed", "cancelled"] as const

// ── Status changer ────────────────────────────────────────────────────────
export function AdminProjectActions({ project }: { project: any }) {
  const [status, setStatus] = useState(project.status)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(newStatus: string) {
    setSaving(true)
    await supabase.from("projects").update({ status: newStatus, ...(newStatus === "active" ? { started_at: new Date().toISOString() } : {}), ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}) }).eq("id", project.id)
    setStatus(newStatus)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={e => updateStatus(e.target.value)}
        disabled={saving}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring capitalize"
      >
        {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
    </div>
  )
}

// ── Stage management ──────────────────────────────────────────────────────
export function AdminProjectStages({ projectId, stages }: { projectId: string; stages: (Stage & { deliverable_files: DeliverableFile[] })[] }) {
  const [items, setItems] = useState(stages)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const supabase = createClient()
  const router = useRouter()

  async function addStage() {
    if (!newName) return
    const { data } = await supabase.from("stages").insert({
      project_id: projectId, name: newName, description: newDesc,
      sort_order: items.length + 1, visible_to_client: false, status: "pending"
    }).select("*, deliverable_files(*)").single()
    if (data) { setItems(prev => [...prev, data]); setNewName(""); setNewDesc(""); setAdding(false) }
  }

  async function updateStage(stageId: string, updates: Partial<Stage>) {
    await supabase.from("stages").update(updates).eq("id", stageId)
    setItems(prev => prev.map(s => s.id === stageId ? { ...s, ...updates } : s))
    router.refresh()
  }

  async function markComplete(stageId: string) {
    const updates = { status: "completed" as const, completed_at: new Date().toISOString(), visible_to_client: true }
    await updateStage(stageId, updates)
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
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3" /> Add stage
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((stage) => (
          <div key={stage.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {stageIcon(stage.status)}
              <p className="font-medium text-sm flex-1">{stage.name}</p>
              <button
                onClick={() => updateStage(stage.id, { visible_to_client: !stage.visible_to_client })}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={stage.visible_to_client ? "Hide from client" : "Show to client"}
              >
                {stage.visible_to_client ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
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

        {!items.length && !adding && (
          <p className="text-sm text-muted-foreground text-center py-4">No stages yet</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Payment management ────────────────────────────────────────────────────
export function AdminProjectPayments({ projectId, payments }: { projectId: string; payments: Payment[] }) {
  const [items, setItems] = useState(payments)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ label: "", amount: "", method: "stripe", due_date: "" })
  const supabase = createClient()

  async function addPayment() {
    if (!form.label || !form.amount) return
    const { data } = await supabase.from("payments").insert({
      project_id: projectId, label: form.label, amount: parseFloat(form.amount),
      method: form.method, due_date: form.due_date || null, status: "pending"
    }).select().single()
    if (data) { setItems(prev => [...prev, data]); setForm({ label: "", amount: "", method: "stripe", due_date: "" }); setAdding(false) }
  }

  async function markPaid(paymentId: string) {
    await supabase.from("payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", paymentId)
    setItems(prev => prev.map(p => p.id === paymentId ? { ...p, status: "paid" as const, paid_at: new Date().toISOString() } : p))
  }

  const paymentBadge = (status: string) => ({ pending: "warning", paid: "success", overdue: "destructive" }[status] as any ?? "default")

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
            <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
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
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function save() {
    setSaving(true)
    await supabase.from("projects").update({ admin_notes: notes }).eq("id", projectId)
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
