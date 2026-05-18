"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, ChevronRight, UserPlus, Users, Copy, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { INDUSTRIES } from "@/lib/industries"
import type { IntakeQuestion, Service, ServiceTier } from "@/types"

const defaultServices: Service[] = [
  { id: "starter", tier: "starter" as ServiceTier, name: "Starter", tagline: "Your first step online", description: "Clean 5-page website, mobile responsive, contact form, basic SEO.", price_label: "3-5 days", features: [], active: true },
  { id: "standard", tier: "standard" as ServiceTier, name: "Standard", tagline: "A site that works harder", description: "Multi-page with animations, optional CMS, integrations, advanced SEO.", price_label: "7-10 days", features: [], active: true },
  { id: "pro", tier: "pro" as ServiceTier, name: "Pro", tagline: "From idea to full product", description: "Full web app with authentication, database, dashboards, custom features.", price_label: "14-21 days", features: [], active: true },
]

type Client = { id: string; name: string; email: string; created_at: string }

const steps = ["Pick client", "Choose service", "Project details", "Review & create"]

export default function AdminNewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)

  // Client step
  const [mode, setMode] = useState<"existing" | "invite">("existing")
  const [clients, setClients] = useState<Client[]>([])
  const [clientFilter, setClientFilter] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [loadingClients, setLoadingClients] = useState(true)

  // Service step
  const [services, setServices] = useState<Service[]>(defaultServices)
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null)

  // Project step
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [invitedCreds, setInvitedCreds] = useState<{ email: string; tempPassword: string } | null>(null)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Load clients + services on mount
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/clients")
      const data = await res.json()
      setClients(data.clients ?? [])
      setLoadingClients(false)
    })()

    const loadServices = async () => {
      const { data } = await supabase.from("services").select("*").eq("active", true).order("name")
      const fetched = (data ?? []) as unknown as Service[]
      setServices([
        ...defaultServices.filter(d => !fetched.some(s => s.tier === d.tier)),
        ...fetched,
      ].sort((a, b) => a.name.localeCompare(b.name)))
    }
    void loadServices()
  }, [supabase])

  const loadQuestions = useCallback(async (tier: ServiceTier) => {
    setLoadingQuestions(true)
    const res = await fetch(`/api/intake/questions?tier=${tier}`)
    const data = await res.json()
    setQuestions((data.questions ?? []) as IntakeQuestion[])
    setLoadingQuestions(false)
  }, [])

  useEffect(() => {
    if (selectedTier) {
      setAnswers({})
      void loadQuestions(selectedTier)
    }
  }, [loadQuestions, selectedTier])

  const filteredClients = clientFilter.trim()
    ? clients.filter(c =>
        [c.name, c.email].some(f => f.toLowerCase().includes(clientFilter.toLowerCase()))
      )
    : clients

  const requiredAnswered = questions.filter(q => q.required).every(q => answers[q.id]?.trim())

  const clientStepValid =
    (mode === "existing" && !!selectedClientId) ||
    (mode === "invite" && inviteName.trim() && /^\S+@\S+\.\S+$/.test(inviteEmail.trim()))

  async function handleSubmit() {
    if (!clientStepValid || !selectedTier || !title) return
    setSubmitting(true)
    setError("")

    const payload: any = {
      title,
      service_tier: selectedTier,
      answers,
    }
    if (mode === "existing") {
      payload.client_id = selectedClientId
    } else {
      payload.client_email = inviteEmail.trim()
      payload.client_name = inviteName.trim()
    }

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok || !data.project) {
      setError(data.error ?? "Could not create project")
      setSubmitting(false)
      return
    }

    setCreatedProjectId(data.project.id)
    if (data.invited) {
      setInvitedCreds(data.invited)
    } else {
      router.push(`/admin/projects/${data.project.id}`)
    }
    setSubmitting(false)
  }

  // Success view (after invite)
  if (createdProjectId && invitedCreds) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-green-900">Project created — client invited</h1>
              <p className="text-sm text-green-800">
                {process.env.RESEND_API_KEY ? "We've emailed login details." : "Send these login details to the client."}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client login details</CardTitle>
            <CardDescription>The client will need these to log in for the first time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between bg-muted/50 rounded px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-mono text-sm">{invitedCreds.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Temporary password</p>
                <p className="font-mono text-sm">{invitedCreds.tempPassword}</p>
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `Email: ${invitedCreds.email}\nPassword: ${invitedCreds.tempPassword}\nLogin: ${window.location.origin}/login`
                  )
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-accent"
              >
                {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy all</>}
              </button>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Tip: ask the client to change their password after first login.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/projects")}>Back to projects</Button>
          <Button className="flex-1" onClick={() => router.push(`/admin/projects/${createdProjectId}`)}>
            Manage this project <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create a project</h1>
        <p className="text-muted-foreground mt-1">Set up a project for an existing client, or invite a new one.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 text-sm",
              i < step ? "text-foreground" : i === step ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                i < step ? "bg-foreground text-background border-foreground" :
                i === step ? "border-foreground" : "border-border"
              )}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={cn("h-px w-6 mx-2", i < step ? "bg-foreground" : "bg-border")} />}
          </div>
        ))}
      </div>

      {/* Step 0 — pick or invite client */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("existing")}
              className={cn(
                "rounded-lg border p-4 text-left transition-all",
                mode === "existing" ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/30"
              )}
            >
              <Users className="h-5 w-5 mb-2" />
              <p className="font-semibold text-sm">Existing client</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pick from your client list</p>
            </button>
            <button
              onClick={() => setMode("invite")}
              className={cn(
                "rounded-lg border p-4 text-left transition-all",
                mode === "invite" ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/30"
              )}
            >
              <UserPlus className="h-5 w-5 mb-2" />
              <p className="font-semibold text-sm">Invite new client</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create account + send login</p>
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-3">
              <Input
                placeholder="Search clients by name or email…"
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
              />
              <div className="border border-border rounded-lg divide-y divide-border max-h-80 overflow-y-auto">
                {loadingClients ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
                ) : filteredClients.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    {clientFilter ? "No clients match your search." : "No clients yet. Use 'Invite new client' to start."}
                  </p>
                ) : (
                  filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between",
                        selectedClientId === c.id && "bg-accent"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      {selectedClientId === c.id && <Check className="h-4 w-4 text-foreground" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-muted/30 rounded-lg p-5 border border-dashed border-border">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Client name *</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Smith"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Client email *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="jane@company.com.au"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 rounded p-3">
                <Mail className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-600" />
                <p>
                  We&apos;ll create their account, generate a temporary password, and (if Resend is configured) email them the login details. Otherwise you&apos;ll see the password to share manually.
                </p>
              </div>
            </div>
          )}

          <Button className="w-full" disabled={!clientStepValid} onClick={() => setStep(1)}>
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1 — service tier */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">What kind of project is this?</p>
          {services.map(tier => (
            <Card
              key={tier.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedTier === tier.tier ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/30"
              )}
              onClick={() => setSelectedTier(tier.tier)}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                  selectedTier === tier.tier ? "border-foreground bg-foreground" : "border-border"
                )}>
                  {selectedTier === tier.tier && <div className="w-2 h-2 rounded-full bg-background" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{tier.name}</span>
                    <span className="text-xs text-muted-foreground">{tier.tagline}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{tier.description}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{tier.price_label}</span>
              </CardContent>
            </Card>
          ))}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" disabled={!selectedTier} onClick={() => setStep(2)}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — project details + intake */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project name *</Label>
            <Input id="title" placeholder="e.g. Carter Plumbing — Office Network" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {loadingQuestions ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No intake questions for this tier. You can still proceed.</p>
              )}
              {questions.map(q => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id}>
                    {q.label} {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  {q.type === "textarea" ? (
                    <Textarea id={q.id} value={answers[q.id] ?? ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Answer on behalf of the client (or leave blank for them to fill in)…" />
                  ) : q.type === "industry" ? (
                    <select
                      id={q.id}
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background"
                    >
                      <option value="">— Select industry —</option>
                      {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  ) : q.type === "select" && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <div
                            className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0", answers[q.id] === opt ? "border-foreground bg-foreground" : "border-border")}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input id={q.id} value={answers[q.id] ?? ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Answer…" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" disabled={!title || !requiredAnswered} onClick={() => setStep(3)}>
              Review <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — review & submit */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review</CardTitle>
              <CardDescription>Check the details before creating the project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Row label="Client">
                {mode === "existing"
                  ? (() => {
                    const c = clients.find(x => x.id === selectedClientId)
                    return c ? `${c.name} (${c.email})` : "—"
                  })()
                  : `${inviteName} (${inviteEmail}) — invite`}
              </Row>
              <Row label="Service tier"><span className="capitalize">{selectedTier}</span></Row>
              <Row label="Project name">{title}</Row>
              {questions.filter(q => answers[q.id]).map(q => (
                <Row key={q.id} label={q.label}>{answers[q.id]}</Row>
              ))}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button variant="brand" className="flex-1" loading={submitting} onClick={handleSubmit}>
              {mode === "invite" ? "Create project & invite client" : "Create project"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  )
}
