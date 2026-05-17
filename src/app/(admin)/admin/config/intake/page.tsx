"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, GripVertical, Eye, EyeOff, Trash2 } from "lucide-react"
import type { IntakeQuestion, ServiceTier } from "@/types"

const TIERS: ServiceTier[] = ["starter", "standard", "pro"]
const TYPES = ["text", "textarea", "select", "checkbox", "file"] as const

export default function IntakeConfigPage() {
  const supabase = createClient()
  const [activeTier, setActiveTier] = useState<ServiceTier>("starter")
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ label: "", type: "text", options: "", required: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadQuestions() }, [activeTier])

  async function loadQuestions() {
    setLoading(true)
    const { data } = await supabase.from("intake_questions").select("*").eq("service_tier", activeTier).order("sort_order")
    setQuestions(data ?? [])
    setLoading(false)
  }

  async function addQuestion() {
    if (!form.label) return
    const options = form.type === "select" ? form.options.split(",").map(o => o.trim()).filter(Boolean) : null
    const { data } = await supabase.from("intake_questions").insert({
      service_tier: activeTier, label: form.label, type: form.type,
      options: options ? options : null, required: form.required,
      sort_order: questions.length + 1, active: true
    }).select().single()
    if (data) { setQuestions(prev => [...prev, data]); setForm({ label: "", type: "text", options: "", required: true }); setAdding(false) }
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("intake_questions").update({ active: !active }).eq("id", id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, active: !active } : q))
  }

  async function deleteQuestion(id: string) {
    await supabase.from("intake_questions").delete().eq("id", id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Intake Questions</h1>
        <p className="text-muted-foreground mt-1">Configure what we ask clients per service tier</p>
      </div>

      <div className="flex gap-2">
        {TIERS.map(tier => (
          <button key={tier} onClick={() => setActiveTier(tier)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTier === tier ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}>
            {tier}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base capitalize">{activeTier} tier questions</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-3 w-3" /> Add question</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : questions.map((q, idx) => (
            <div key={q.id} className={`flex items-center gap-3 border border-border rounded-lg px-3 py-2.5 ${!q.active ? "opacity-50" : ""}`}>
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{q.label}</p>
                <div className="flex gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-xs">{q.type}</Badge>
                  {q.required && <Badge variant="default" className="text-xs">Required</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(q.id, q.active)} className="text-muted-foreground hover:text-foreground p-1">
                  {q.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => deleteQuestion(q.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {adding && (
            <div className="border border-dashed border-border rounded-lg p-4 space-y-3 mt-2">
              <div className="space-y-1.5"><Label>Question label *</Label><Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. What does your business do?" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Required</Label>
                  <select value={form.required ? "yes" : "no"} onChange={e => setForm(p => ({ ...p, required: e.target.value === "yes" }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              {form.type === "select" && (
                <div className="space-y-1.5"><Label>Options (comma-separated)</Label><Input value={form.options} onChange={e => setForm(p => ({ ...p, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" /></div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={addQuestion} disabled={!form.label}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {!loading && !questions.length && !adding && (
            <p className="text-sm text-muted-foreground text-center py-6">No questions for this tier yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
