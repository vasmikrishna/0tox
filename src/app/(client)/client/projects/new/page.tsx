"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IntakeQuestion, ServiceTier } from "@/types"

const tiers = [
  {
    id: "starter" as ServiceTier,
    name: "Starter",
    tagline: "Your first step online",
    description: "Clean 5-page website, mobile responsive, contact form, basic SEO.",
    timeline: "3–5 days",
  },
  {
    id: "standard" as ServiceTier,
    name: "Standard",
    tagline: "A site that works harder",
    description: "Multi-page with animations, optional CMS, integrations, advanced SEO.",
    timeline: "7–10 days",
  },
  {
    id: "pro" as ServiceTier,
    name: "Pro",
    tagline: "From idea to full product",
    description: "Full web app with authentication, database, dashboards, custom features.",
    timeline: "14–21 days",
  },
]

const steps = ["Choose service", "Project details", "Review & submit"]

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null)
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (selectedTier) loadQuestions(selectedTier)
  }, [selectedTier])

  async function loadQuestions(tier: ServiceTier) {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("intake_questions")
      .select("*")
      .eq("service_tier", tier)
      .eq("active", true)
      .order("sort_order")
    setQuestions(data ?? [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!selectedTier || !title) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: project, error } = await supabase
      .from("projects")
      .insert({ client_id: user!.id, title, service_tier: selectedTier, status: "intake" })
      .select()
      .single()

    if (error || !project) { setSubmitting(false); return }

    const responses = Object.entries(answers)
      .filter(([, answer]) => answer)
      .map(([question_id, answer]) => ({ project_id: project.id, question_id, answer }))

    if (responses.length) await supabase.from("intake_responses").insert(responses)

    router.push(`/client/projects/${project.id}?submitted=true`)
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
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedTier === tier.id ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/30"
              )}
              onClick={() => setSelectedTier(tier.id)}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                  selectedTier === tier.id ? "border-foreground bg-foreground" : "border-border"
                )}>
                  {selectedTier === tier.id && <div className="w-2 h-2 rounded-full bg-background" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{tier.name}</span>
                    <span className="text-xs text-muted-foreground">{tier.tagline}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{tier.description}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{tier.timeline}</span>
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
            <Button className="flex-1" disabled={!title} onClick={() => setStep(2)}>
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
        </div>
      )}
    </div>
  )
}
