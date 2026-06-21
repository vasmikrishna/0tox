"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { defaultStageTemplatesFor, DEFAULT_SERVICE_TIERS } from "@/lib/stage-template-defaults"
import { Plus, GripVertical, Eye, EyeOff, Trash2 } from "lucide-react"
import type { IntakeQuestion, Service, ServiceTier, StageTemplate } from "@/types"

const TYPES = ["text", "textarea", "select", "checkbox", "file", "industry"] as const

const TYPE_LABELS: Record<string, string> = {
  text: "Short text",
  textarea: "Long text",
  select: "Dropdown (custom options)",
  checkbox: "Checkbox",
  file: "File upload",
  industry: "Industry (built-in list)",
}
const DEFAULT_SERVICES: Service[] = [
  { id: "starter", tier: "starter", name: "Starter", tagline: "Your first step online", description: "Clean starter website", price_label: "Custom pricing", features: [], active: true },
  { id: "standard", tier: "standard", name: "Standard", tagline: "A site that works harder", description: "Advanced website", price_label: "Custom pricing", features: [], active: true },
  { id: "pro", tier: "pro", name: "Pro", tagline: "From idea to full product", description: "Full web app", price_label: "Custom pricing", features: [], active: true },
]
const LOCAL_SERVICES_KEY = "0tox_custom_services"
const LOCAL_STAGE_TEMPLATES_KEY = "0tox_custom_stage_templates"

function slugifyService(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function readLocalServices() {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_SERVICES_KEY) ?? "[]") as Service[]
  } catch {
    return []
  }
}

function writeLocalServices(services: Service[]) {
  window.localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(services))
}

function readLocalStageTemplates() {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STAGE_TEMPLATES_KEY) ?? "[]") as StageTemplate[]
  } catch {
    return []
  }
}

function writeLocalStageTemplates(templates: StageTemplate[]) {
  window.localStorage.setItem(LOCAL_STAGE_TEMPLATES_KEY, JSON.stringify(templates))
}

export default function IntakeConfigPage() {
  const supabase = createClient()
  const [activeTier, setActiveTier] = useState<ServiceTier>("starter")
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>([])
  const [defaultStageDraft, setDefaultStageDraft] = useState<StageTemplate[]>(() => defaultStageTemplatesFor("starter"))
  const [adding, setAdding] = useState(false)
  const [addingStage, setAddingStage] = useState(false)
  const [addingService, setAddingService] = useState(false)
  const [form, setForm] = useState<{ label: string; type: IntakeQuestion["type"]; options: string; required: boolean }>({ label: "", type: "text", options: "", required: true })
  const [stageForm, setStageForm] = useState({ name: "", description: "" })
  const [serviceForm, setServiceForm] = useState({ name: "", tier: "", tagline: "", description: "" })
  const [serviceError, setServiceError] = useState("")
  const [loading, setLoading] = useState(true)
  const [templatesLoading, setTemplatesLoading] = useState(true)

  const loadServices = useCallback(async () => {
    const { data } = await supabase.from("services").select("*").order("name")
    const fetched = (data ?? []) as unknown as Service[]
    const local = readLocalServices()
    const merged = [
      ...DEFAULT_SERVICES.filter(defaultService => !fetched.some(service => service.tier === defaultService.tier)),
      ...fetched,
      ...local.filter(localService => !fetched.some(service => service.tier === localService.tier) && !DEFAULT_SERVICES.some(service => service.tier === localService.tier)),
    ].sort((a, b) => a.name.localeCompare(b.name))
    setServices(merged)
  }, [supabase])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from("intake_questions").select("*").eq("service_tier", activeTier).order("sort_order")
    setQuestions((data ?? []) as unknown as IntakeQuestion[])
    setLoading(false)
  }, [activeTier, supabase])

  const loadStageTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    const { data } = await supabase.from("stage_templates").select("*").eq("service_tier", activeTier).order("sort_order")
    const remote = (data ?? []) as unknown as StageTemplate[]
    const local = readLocalStageTemplates().filter(template => template.service_tier === activeTier)
    setStageTemplates(remote.length ? remote : local)
    setTemplatesLoading(false)
  }, [activeTier, supabase])

  useEffect(() => {
    // The form needs to refetch when the selected tier changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadServices()
    void loadQuestions()
    void loadStageTemplates()
  }, [loadQuestions, loadServices, loadStageTemplates])

  useEffect(() => {
    // Reset built-in template draft when switching default project types.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefaultStageDraft(defaultStageTemplatesFor(activeTier))
  }, [activeTier])

  async function addQuestion() {
    if (!form.label) return
    const options = form.type === "select" ? form.options.split(",").map(o => o.trim()).filter(Boolean) : null
    const { data } = await supabase.from("intake_questions").insert({
      service_tier: activeTier, label: form.label, type: form.type,
      options: options ?? undefined, required: form.required,
      sort_order: questions.length + 1, active: true
    }).select().single()
    if (data) { setQuestions(prev => [...prev, data as unknown as IntakeQuestion]); setForm({ label: "", type: "text", options: "", required: true }); setAdding(false) }
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("intake_questions").update({ active: !active }).eq("id", id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, active: !active } : q))
  }

  async function deleteQuestion(id: string) {
    await supabase.from("intake_questions").delete().eq("id", id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  async function addStageTemplate() {
    if (!stageForm.name.trim()) return

    if (usingDefaultStageTemplates) {
      setDefaultStageDraft(prev => [...prev, {
        id: `draft-${activeTier}-${Date.now()}`,
        service_tier: activeTier,
        name: stageForm.name.trim(),
        description: stageForm.description.trim(),
        sort_order: prev.length + 1,
      }])
      setStageForm({ name: "", description: "" })
      setAddingStage(false)
      return
    }

    const { data } = await supabase.from("stage_templates").insert({
      service_tier: activeTier,
      name: stageForm.name.trim(),
      description: stageForm.description.trim() || null,
      sort_order: stageTemplates.length + 1,
    }).select().single()
    if (data) {
      setStageTemplates(prev => [...prev, data as unknown as StageTemplate])
      setStageForm({ name: "", description: "" })
      setAddingStage(false)
      return
    }

    const localStage: StageTemplate = {
      id: `local-stage-${activeTier}-${Date.now()}`,
      service_tier: activeTier,
      name: stageForm.name.trim(),
      description: stageForm.description.trim(),
      sort_order: stageTemplates.length + 1,
    }
    const localTemplates = [...readLocalStageTemplates().filter(template => template.id !== localStage.id), localStage]
    writeLocalStageTemplates(localTemplates)
    setStageTemplates(prev => [...prev, localStage])
    setStageForm({ name: "", description: "" })
    setAddingStage(false)
  }

  async function seedDefaultStageTemplates() {
    const defaults = defaultStageDraft
      .map((stage, index) => ({
        service_tier: activeTier,
        name: stage.name.trim(),
        description: stage.description?.trim() || null,
        sort_order: index + 1,
      }))
      .filter(stage => stage.name)
    if (!defaults.length) return

    const { data, error } = await supabase.from("stage_templates").insert(defaults).select().order("sort_order")
    if (data?.length && !error) {
      setStageTemplates(data as unknown as StageTemplate[])
      return
    }

    const localTemplates = defaults.map((stage, index) => ({
      id: `local-stage-${activeTier}-${Date.now()}-${index}`,
      service_tier: stage.service_tier,
      name: stage.name,
      description: stage.description ?? "",
      sort_order: stage.sort_order,
    })) satisfies StageTemplate[]
    writeLocalStageTemplates([
      ...readLocalStageTemplates().filter(template => template.service_tier !== activeTier),
      ...localTemplates,
    ])
    setStageTemplates(localTemplates)
  }

  async function addService() {
    const name = serviceForm.name.trim()
    const tier = slugifyService(serviceForm.tier || name)
    if (!name || !tier) return

    setServiceError("")
    const servicePayload = {
      tier,
      name,
      tagline: serviceForm.tagline.trim() || "Custom project type",
      description: serviceForm.description.trim() || "Custom service configured by admin.",
      price_label: "Custom pricing",
      features: [],
      active: true,
    } as never
    const { data, error } = await supabase.from("services").insert(servicePayload).select().single()

    if (error) {
      const service: Service = {
        id: `local-service-${tier}`,
        tier,
        name,
        tagline: serviceForm.tagline.trim() || "Custom project type",
        description: serviceForm.description.trim() || "Custom service configured by admin.",
        price_label: "Custom pricing",
        features: [],
        active: true,
      }
      const localServices = [
        ...readLocalServices().filter(item => item.tier !== service.tier),
        service,
      ]
      writeLocalServices(localServices)
      setServices(prev => [...prev.filter(item => item.tier !== service.tier), service].sort((a, b) => a.name.localeCompare(b.name)))
      setActiveTier(service.tier)
      setServiceForm({ name: "", tier: "", tagline: "", description: "" })
      setAddingService(false)
      setServiceError("")
      return
    }

    if (data) {
      const service = data as unknown as Service
      setServices(prev => [...prev, service])
      setActiveTier(service.tier)
      setServiceForm({ name: "", tier: "", tagline: "", description: "" })
      setAddingService(false)
    }
  }

  async function updateStageTemplate(id: string, updates: Partial<StageTemplate>) {
    if (id.startsWith("local-stage-")) {
      const next = readLocalStageTemplates().map(stage => stage.id === id ? { ...stage, ...updates } : stage)
      writeLocalStageTemplates(next)
      setStageTemplates(prev => prev.map(stage => stage.id === id ? { ...stage, ...updates } : stage))
      return
    }

    await supabase.from("stage_templates").update(updates).eq("id", id)
    setStageTemplates(prev => prev.map(stage => stage.id === id ? { ...stage, ...updates } : stage))
  }

  async function deleteStageTemplate(id: string) {
    if (id.startsWith("local-stage-")) {
      const next = readLocalStageTemplates().filter(stage => stage.id !== id)
      writeLocalStageTemplates(next)
      setStageTemplates(prev => prev.filter(stage => stage.id !== id))
      return
    }

    await supabase.from("stage_templates").delete().eq("id", id)
    setStageTemplates(prev => prev.filter(stage => stage.id !== id))
  }

  function updateDefaultStageTemplate(id: string, updates: Partial<StageTemplate>) {
    setDefaultStageDraft(prev => prev.map(stage => stage.id === id ? { ...stage, ...updates } : stage))
  }

  function deleteDefaultStageTemplate(id: string) {
    setDefaultStageDraft(prev => prev.filter(stage => stage.id !== id))
  }

  const usingDefaultStageTemplates = !stageTemplates.length && DEFAULT_SERVICE_TIERS.includes(activeTier as never)
  const visibleStageTemplates = usingDefaultStageTemplates ? defaultStageDraft : stageTemplates

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project type configuration</h1>
        <p className="text-muted-foreground mt-1">Configure services, intake questions, and default stage templates</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Project types / services</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Starter, Standard, and Pro stay as defaults. Add more service types for custom project workflows.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddingService(true)}><Plus className="h-3 w-3" /> Add service</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {services.map(service => (
              <button key={service.tier} onClick={() => setActiveTier(service.tier)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${activeTier === service.tier ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}>
                {service.name}
              </button>
            ))}
          </div>
          {addingService && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><Label>Service name *</Label><Input value={serviceForm.name} onChange={e => setServiceForm(p => ({ ...p, name: e.target.value, tier: p.tier || slugifyService(e.target.value) }))} placeholder="e.g. Branding, E-commerce, SEO" /></div>
                <div className="space-y-1.5"><Label>Key / slug *</Label><Input value={serviceForm.tier} onChange={e => setServiceForm(p => ({ ...p, tier: slugifyService(e.target.value) }))} placeholder="e.g. ecommerce" /></div>
              </div>
              <div className="space-y-1.5"><Label>Tagline</Label><Input value={serviceForm.tagline} onChange={e => setServiceForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Short label shown for this service" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} placeholder="What this service covers" /></div>
              {serviceError && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{serviceError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={addService} disabled={!serviceForm.name.trim()}>Add service</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingService(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.type] ?? q.type}</Badge>
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
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as IntakeQuestion["type"] }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background">
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
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
              {form.type === "industry" && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2 border border-border">
                  Uses the built-in list of 35+ Australian industries (Accounting, Construction, Hospitality, Retail, etc). No options needed — the client sees a searchable dropdown.
                </p>
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

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base capitalize">{activeTier} stage template</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Used as the default project stage flow. Projects copy these stages once, then can customize independently.</p>
          </div>
          <div className="flex items-center gap-2">
            {usingDefaultStageTemplates && (
              <Button size="sm" onClick={seedDefaultStageTemplates}>Save template</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setAddingStage(true)}><Plus className="h-3 w-3" /> Add stage</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {usingDefaultStageTemplates && (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Editing built-in default stages. Save the template when you want these changes stored for this service type.
            </p>
          )}
          {templatesLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
          ) : visibleStageTemplates.map((stage, idx) => (
            <div key={stage.id} className="grid gap-2 rounded-lg border border-border px-3 py-2.5 md:grid-cols-[auto_1fr_1.4fr_auto] md:items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                <span className="text-xs w-5">{idx + 1}</span>
              </div>
              <Input value={stage.name} onChange={event => usingDefaultStageTemplates ? updateDefaultStageTemplate(stage.id, { name: event.target.value }) : updateStageTemplate(stage.id, { name: event.target.value })} />
              <Input value={stage.description ?? ""} onChange={event => usingDefaultStageTemplates ? updateDefaultStageTemplate(stage.id, { description: event.target.value }) : updateStageTemplate(stage.id, { description: event.target.value })} placeholder="Description" />
              <button onClick={() => usingDefaultStageTemplates ? deleteDefaultStageTemplate(stage.id) : deleteStageTemplate(stage.id)} className="justify-self-start text-muted-foreground hover:text-destructive md:justify-self-end">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {addingStage && (
            <div className="border border-dashed border-border rounded-lg p-4 space-y-3 mt-2">
              <div className="space-y-1.5"><Label>Stage name *</Label><Input value={stageForm.name} onChange={e => setStageForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Discovery Call" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={stageForm.description} onChange={e => setStageForm(p => ({ ...p, description: e.target.value }))} placeholder="What happens in this stage" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addStageTemplate} disabled={!stageForm.name.trim()}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingStage(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {!templatesLoading && !visibleStageTemplates.length && !addingStage && (
            <p className="text-sm text-muted-foreground text-center py-6">No stage template configured for this tier yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
