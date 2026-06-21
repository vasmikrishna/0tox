"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical, Plus, Trash2, Copy, ExternalLink, ArrowLeft, Star, AlignLeft, Type,
  CircleDot, CheckSquare, ChevronDown, Calendar, Upload, Hash, Mail, Phone, Settings2, MessageSquare,
} from "lucide-react"
import type { Survey, SurveySection, SurveyQuestion, SurveyQuestionType } from "@/types"

// ─── Question type catalogue ────────────────────────────────────────────────

const QUESTION_TYPES: { type: SurveyQuestionType; label: string; Icon: React.ElementType }[] = [
  { type: "short_text", label: "Short text", Icon: Type },
  { type: "long_text", label: "Long text", Icon: AlignLeft },
  { type: "single_choice", label: "Single choice", Icon: CircleDot },
  { type: "multiple_choice", label: "Multiple choice", Icon: CheckSquare },
  { type: "dropdown", label: "Dropdown", Icon: ChevronDown },
  { type: "rating", label: "Rating", Icon: Star },
  { type: "date", label: "Date", Icon: Calendar },
  { type: "file_upload", label: "File upload", Icon: Upload },
  { type: "number", label: "Number", Icon: Hash },
  { type: "email", label: "Email", Icon: Mail },
  { type: "phone", label: "Phone", Icon: Phone },
]

const TYPE_LABELS: Record<SurveyQuestionType, string> = Object.fromEntries(
  QUESTION_TYPES.map(({ type, label }) => [type, label])
) as Record<SurveyQuestionType, string>

// ─── Helpers ────────────────────────────────────────────────────────────────

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

// ─── Sortable question card ──────────────────────────────────────────────────

function SortableQuestion({
  question,
  onUpdate,
  onDelete,
}: {
  question: SurveyQuestion
  onUpdate: (q: SurveyQuestion) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [label, setLabel] = useState(question.label)
  const [description, setDescription] = useState(question.description ?? "")
  const [required, setRequired] = useState(question.required)
  const [options, setOptions] = useState<string[]>(question.options ?? [])

  const needsOptions = ["single_choice", "multiple_choice", "dropdown"].includes(question.type)

  async function save() {
    setSaving(true)
    const updated = { label, description: description || undefined, required, options: needsOptions ? options : undefined }
    await api(`/api/admin/surveys/${question.survey_id}/questions/${question.id}`, "PATCH", updated)
    onUpdate({ ...question, ...updated })
    setSaving(false)
    setEditing(false)
  }

  function addOption() { setOptions(prev => [...prev, `Option ${prev.length + 1}`]) }
  function removeOption(i: number) { setOptions(prev => prev.filter((_, j) => j !== i)) }
  function updateOption(i: number, val: string) { setOptions(prev => prev.map((o, j) => j === i ? val : o)) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-background transition-shadow",
        isDragging && "shadow-lg ring-1 ring-foreground/20 opacity-80"
      )}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
          aria-label="Drag to reorder"
          data-testid={`drag-handle-${question.id}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Question label</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} autoFocus data-testid={`question-label-${question.id}`} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Helper text (optional)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Appears below the label" />
              </div>
              {needsOptions && (
                <div className="space-y-1">
                  <Label className="text-xs">Options</Label>
                  <div className="space-y-1.5">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={opt} onChange={e => updateOption(i, e.target.value)} className="h-8 text-sm" />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-7 text-xs">
                      <Plus className="h-3 w-3" /> Add option
                    </Button>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={e => setRequired(e.target.checked)}
                  className="h-4 w-4 accent-foreground rounded"
                  data-testid={`required-toggle-${question.id}`}
                />
                Required
              </label>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="brand" loading={saving} onClick={save} data-testid={`save-question-${question.id}`}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              className="text-left w-full group"
              onClick={() => setEditing(true)}
              data-testid={`edit-question-${question.id}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{question.label}</span>
                {question.required && <span className="text-destructive text-xs">*</span>}
                <Badge variant="outline" className="text-xs">{TYPE_LABELS[question.type]}</Badge>
              </div>
              {question.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{question.description}</p>
              )}
              {needsOptions && (options.length > 0) && (
                <p className="text-xs text-muted-foreground mt-0.5">{options.join(", ")}</p>
              )}
              <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors mt-1 block">
                Click to edit
              </span>
            </button>
          )}
        </div>

        <button
          className="mt-0.5 text-muted-foreground/40 hover:text-destructive transition-colors"
          onClick={() => onDelete(question.id)}
          aria-label="Delete question"
          data-testid={`delete-question-${question.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Type picker modal ───────────────────────────────────────────────────────

function TypePicker({ onSelect, onClose }: { onSelect: (type: SurveyQuestionType) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Choose question type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map(({ type, label, Icon }) => (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="flex items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-muted transition-colors text-left"
                data-testid={`type-picker-${type}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main builder ────────────────────────────────────────────────────────────

interface Props {
  survey: Survey
  sections: (SurveySection & { questions: SurveyQuestion[] })[]
  projects: { id: string; title: string }[]
}

export function SurveyBuilder({ survey: initialSurvey, sections: initialSections, projects }: Props) {
  const router = useRouter()
  const [survey, setSurvey] = useState(initialSurvey)
  const [sections, setSections] = useState(initialSections)
  const [pickingForSection, setPickingForSection] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [copied, setCopied] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = `${origin}/s/${survey.slug}`

  // ── Settings ─────────────────────────────────────────────────────────────

  async function updateSurvey(patch: Partial<Survey>) {
    const optimistic = { ...survey, ...patch }
    setSurvey(optimistic)
    const data = await api(`/api/admin/surveys/${survey.id}`, "PATCH", patch)
    if (data.survey) setSurvey(data.survey)
  }

  async function saveSettings() {
    setSavingSettings(true)
    await updateSurvey({
      status: survey.status,
      allow_anonymous: survey.allow_anonymous,
      collect_email: survey.collect_email,
      one_response: survey.one_response,
      thank_you_message: survey.thank_you_message,
      project_id: survey.project_id,
    })
    setSavingSettings(false)
  }

  async function deleteSurvey() {
    if (!confirm("Delete this survey permanently? All responses will be lost.")) return
    await api(`/api/admin/surveys/${survey.id}`, "DELETE")
    router.push("/admin/surveys")
  }

  async function duplicateSurvey() {
    const data = await api(`/api/admin/surveys/${survey.id}/duplicate`, "POST")
    if (data.survey) router.push(`/admin/surveys/${data.survey.id}`)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  async function addSection() {
    const data = await api(`/api/admin/surveys/${survey.id}/sections`, "POST", { title: `Section ${sections.length + 1}` })
    if (data.section) setSections(prev => [...prev, data.section])
  }

  async function updateSection(sId: string, patch: { title?: string; description?: string }) {
    setSections(prev => prev.map(s => s.id === sId ? { ...s, ...patch } : s))
    await api(`/api/admin/surveys/${survey.id}/sections/${sId}`, "PATCH", patch)
  }

  async function deleteSection(sId: string) {
    if (!confirm("Delete this section and all its questions?")) return
    setSections(prev => prev.filter(s => s.id !== sId))
    await api(`/api/admin/surveys/${survey.id}/sections/${sId}`, "DELETE")
  }

  // ── Questions ────────────────────────────────────────────────────────────

  async function addQuestion(sectionId: string, type: SurveyQuestionType) {
    setPickingForSection(null)
    const defaults: Partial<SurveyQuestion> = {}
    if (["single_choice", "multiple_choice", "dropdown"].includes(type)) {
      defaults.options = ["Option 1", "Option 2"]
    }
    const data = await api(`/api/admin/surveys/${survey.id}/questions`, "POST", {
      section_id: sectionId,
      type,
      label: `New ${TYPE_LABELS[type]} question`,
      required: false,
      ...defaults,
    })
    if (data.question) {
      setSections(prev => prev.map(s =>
        s.id === sectionId ? { ...s, questions: [...(s.questions ?? []), data.question] } : s
      ))
    }
  }

  function updateQuestion(updated: SurveyQuestion) {
    setSections(prev => prev.map(s => ({
      ...s,
      questions: s.questions.map(q => q.id === updated.id ? updated : q),
    })))
  }

  async function deleteQuestion(sectionId: string, questionId: string) {
    if (!confirm("Delete this question?")) return
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s
    ))
    await api(`/api/admin/surveys/${survey.id}/questions/${questionId}`, "DELETE")
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent, sectionId: string) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      const oldIndex = s.questions.findIndex(q => q.id === active.id)
      const newIndex = s.questions.findIndex(q => q.id === over.id)
      const reordered = arrayMove(s.questions, oldIndex, newIndex)
      const ids = reordered.map(q => q.id)
      api(`/api/admin/surveys/${survey.id}/questions/reorder`, "PATCH", { ids })
      return { ...s, questions: reordered }
    }))
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/surveys"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold truncate">{survey.title}</h1>
            <p className="text-xs text-muted-foreground font-mono">/s/{survey.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={survey.status === "active" ? "success" : survey.status === "closed" ? "warning" : "default"}>
            {survey.status}
          </Badge>
          {survey.status === "active" && (
            <Button size="sm" variant="outline" asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Preview
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/admin/surveys/${survey.id}/responses`}>
              <MessageSquare className="h-3.5 w-3.5" /> Responses
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-0 max-w-6xl mx-auto">
        {/* Left: Questions */}
        <div className="flex-1 min-w-0 px-4 py-6 space-y-6">
          {sections.map(section => (
            <div key={section.id} className="space-y-3">
              {/* Section header */}
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <input
                    className="font-semibold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-foreground outline-none w-full py-0.5 transition-colors"
                    value={section.title ?? ""}
                    onChange={e => updateSection(section.id, { title: e.target.value })}
                    onBlur={e => updateSection(section.id, { title: e.target.value })}
                    placeholder="Section title"
                    data-testid={`section-title-${section.id}`}
                  />
                  <input
                    className="text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-foreground outline-none w-full py-0.5 transition-colors"
                    value={section.description ?? ""}
                    onChange={e => updateSection(section.id, { description: e.target.value })}
                    onBlur={e => updateSection(section.id, { description: e.target.value })}
                    placeholder="Section description (optional)"
                  />
                </div>
                {sections.length > 1 && (
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors mt-1"
                    data-testid={`delete-section-${section.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Questions */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, section.id)}>
                <SortableContext items={section.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {section.questions.map(q => (
                      <SortableQuestion
                        key={q.id}
                        question={q}
                        onUpdate={updateQuestion}
                        onDelete={(qId) => deleteQuestion(section.id, qId)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {section.questions.length === 0 && (
                <p className="text-sm text-muted-foreground/60 text-center py-4 border border-dashed rounded-lg">
                  No questions yet — add one below
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setPickingForSection(section.id)}
                data-testid={`add-question-${section.id}`}
              >
                <Plus className="h-4 w-4" /> Add question
              </Button>
            </div>
          ))}

          <Button variant="ghost" size="sm" onClick={addSection} className="text-muted-foreground" data-testid="add-section-btn">
            <Plus className="h-4 w-4" /> Add section
          </Button>
        </div>

        {/* Right: Settings */}
        <div className="w-72 shrink-0 border-l px-4 py-6 space-y-5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Settings</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="status-select" className="text-xs">Status</Label>
              <select
                id="status-select"
                data-testid="survey-status-select"
                value={survey.status}
                onChange={e => setSurvey(s => ({ ...s, status: e.target.value as Survey["status"] }))}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="active">Active (accepting responses)</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="project-select" className="text-xs">Link to project (optional)</Label>
                <select
                  id="project-select"
                  value={survey.project_id ?? ""}
                  onChange={e => setSurvey(s => ({ ...s, project_id: e.target.value || undefined }))}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— No project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {(
                [
                  { key: "allow_anonymous", label: "Allow anonymous responses" },
                  { key: "collect_email", label: "Collect respondent email" },
                  { key: "one_response", label: "One response per person" },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(survey[key])}
                    onChange={e => setSurvey(s => ({ ...s, [key]: e.target.checked }))}
                    className="h-4 w-4 accent-foreground rounded"
                    data-testid={`toggle-${key}`}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Thank-you message</Label>
              <Textarea
                value={survey.thank_you_message ?? ""}
                onChange={e => setSurvey(s => ({ ...s, thank_you_message: e.target.value }))}
                rows={3}
                placeholder="Thank you for your response!"
                className="text-sm"
                data-testid="thank-you-textarea"
              />
            </div>

            <Button variant="brand" size="sm" className="w-full" loading={savingSettings} onClick={saveSettings} data-testid="save-settings-btn">
              Save settings
            </Button>
          </div>

          {survey.status === "active" && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium">Share link</p>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs font-mono h-8 bg-muted" />
                <Button size="sm" variant="outline" onClick={copyLink} className="h-8 shrink-0" data-testid="copy-link-btn">
                  {copied ? "Copied!" : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={duplicateSurvey} data-testid="duplicate-survey-btn">
              <Copy className="h-3.5 w-3.5" /> Duplicate survey
            </Button>
            <Button variant="destructive" size="sm" className="w-full" onClick={deleteSurvey} data-testid="delete-survey-btn">
              <Trash2 className="h-3.5 w-3.5" /> Delete survey
            </Button>
          </div>
        </div>
      </div>

      {/* Type picker overlay */}
      {pickingForSection && (
        <TypePicker
          onSelect={type => addQuestion(pickingForSection, type)}
          onClose={() => setPickingForSection(null)}
        />
      )}
    </div>
  )
}
