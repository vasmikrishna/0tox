"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { INDUSTRIES } from "@/lib/industries"
import type { IntakeQuestion, Service, ServiceTier } from "@/types"

const defaultServices: Service[] = [
  {
    id: "starter",
    tier: "starter" as ServiceTier,
    name: "Starter",
    tagline: "Your first step online",
    description: "Clean 5-page website, mobile responsive, contact form, basic SEO.",
    price_label: "3-5 days",
    features: [],
    active: true,
  },
  {
    id: "standard",
    tier: "standard" as ServiceTier,
    name: "Standard",
    tagline: "A site that works harder",
    description: "Multi-page with animations, optional CMS, integrations, advanced SEO.",
    price_label: "7-10 days",
    features: [],
    active: true,
  },
  {
    id: "pro",
    tier: "pro" as ServiceTier,
    name: "Pro",
    tagline: "From idea to full product",
    description: "Full web app with authentication, database, dashboards, custom features.",
    price_label: "14-21 days",
    features: [],
    active: true,
  },
]
const LOCAL_SERVICES_KEY = "nexoit_custom_services"

function readLocalServices() {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_SERVICES_KEY) ?? "[]") as Service[]
  } catch {
    return []
  }
}

const steps = ["Choose service", "Project details", "Review & submit"]

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [services, setServices] = useState<Service[]>(defaultServices)
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null)
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const loadQuestions = useCallback(async (tier: ServiceTier) => {
    setLoading(true)
    setError("")
    const response = await fetch(`/api/intake/questions?tier=${tier}`)
    const data = await response.json()
    setQuestions((data.questions ?? []) as IntakeQuestion[])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase.from("services").select("*").eq("active", true).order("name")
      const fetched = (data ?? []) as unknown as Service[]
      const local = readLocalServices()
      setServices([
        ...defaultServices.filter(defaultService => !fetched.some(service => service.tier === defaultService.tier)),
        ...fetched,
        ...local.filter(localService => !fetched.some(service => service.tier === localService.tier) && !defaultServices.some(service => service.tier === localService.tier)),
      ].sort((a, b) => a.name.localeCompare(b.name)))
    }

    void loadServices()
  }, [supabase])

  useEffect(() => {
    // The wizard loads the relevant intake questions after tier selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedTier) {
      setAnswers({})
      void loadQuestions(selectedTier)
    }
  }, [loadQuestions, selectedTier])

  const requiredQuestionsAnswered = questions
    .filter(question => question.required)
    .every(question => answers[question.id]?.trim())

  async function handleSubmit() {
    if (!selectedTier || !title) return
    setSubmitting(true)
    setError("")

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, service_tier: selectedTier, answers }),
    })
    const data = await response.json()

    if (!response.ok || !data.project) {
      setError(data.error ?? "Could not submit project")
      setSubmitting(false)
      return
    }

    router.push(`/client/projects/${data.project.id}?submitted=true`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Start a new project</h1>
        <p className="text-muted-foreground mt-1">Tell us what you need and we&apos;ll get started</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0">
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
            {i < steps.length - 1 && <div className={cn("h-px w-8 mx-2", i < step ? "bg-foreground" : "bg-border")} />}
          </div>
        ))}
      </div>

      {/* Step 0 — Tier Selection */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">What kind of project do you need?</p>
          {services.map((tier) => (
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
          <Button className="w-full" disabled={!selectedTier} onClick={() => setStep(1)}>
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1 — Intake Form */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project name *</Label>
            <Input
              id="title"
              placeholder="e.g. My Coffee Shop Website"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id}>
                    {q.label} {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  {q.type === "textarea" ? (
                    <Textarea
                      id={q.id}
                      placeholder="Your answer..."
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  ) : q.type === "industry" ? (
                    <select
                      id={q.id}
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background"
                    >
                      <option value="">— Select your industry —</option>
                      {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  ) : q.type === "select" && q.options ? (
                    <div className="space-y-2">
                      {q.options.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border-2 flex-shrink-0",
                              answers[q.id] === opt ? "border-foreground bg-foreground" : "border-border"
                            )}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input
                      id={q.id}
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Your answer..."
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" disabled={!title || !requiredQuestionsAnswered} onClick={() => setStep(2)}>
              Review answers <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review your submission</CardTitle>
              <CardDescription>Make sure everything looks correct before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service tier</span>
                <span className="font-medium capitalize">{selectedTier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project name</span>
                <span className="font-medium">{title}</span>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                {questions.filter(q => answers[q.id]).map((q) => (
                  <div key={q.id} className="text-sm">
                    <p className="text-muted-foreground">{q.label}</p>
                    <p className="font-medium mt-0.5">{answers[q.id]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button variant="brand" className="flex-1" loading={submitting} onClick={handleSubmit}>
              Submit project
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
