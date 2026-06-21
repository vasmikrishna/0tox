"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QuestionInput } from "@/components/survey/question-input"
import { SurveyProgressBar } from "@/components/survey/progress-bar"
import type { Survey, SurveySection, SurveyQuestion } from "@/types"

interface SurveyFormProps {
  survey: Survey
  sections: SurveySection[]
}

function getAllQuestions(sections: SurveySection[]): SurveyQuestion[] {
  return sections.flatMap((s) => s.questions ?? [])
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function SurveyForm({ survey, sections }: SurveyFormProps) {
  const router = useRouter()
  const isMultiSection = sections.length > 1

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [collectedEmail, setCollectedEmail] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentSection = sections[currentSectionIndex]
  const currentQuestions = currentSection?.questions ?? []
  const isLastSection = currentSectionIndex === sections.length - 1

  function validateSection(questions: SurveyQuestion[]): Record<string, string> {
    const newErrors: Record<string, string> = {}

    for (const q of questions) {
      const val = answers[q.id]

      if (q.required) {
        if (q.type === "multiple_choice") {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[q.id] = "Please select at least one option."
          }
        } else if (!val || (typeof val === "string" && val.trim() === "")) {
          newErrors[q.id] = "This field is required."
        }
      }

      if (q.type === "email" && val && typeof val === "string" && val.trim() !== "") {
        if (!validateEmail(val.trim())) {
          newErrors[q.id] = "Please enter a valid email address."
        }
      }
    }

    return newErrors
  }

  function handleAnswerChange(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  function handleNext() {
    const sectionErrors = validateSection(currentQuestions)
    if (Object.keys(sectionErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...sectionErrors }))
      return
    }
    setCurrentSectionIndex((i) => i + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleBack() {
    setCurrentSectionIndex((i) => i - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    // Validate all visible questions on submit
    const questionsToValidate = isMultiSection
      ? currentQuestions
      : getAllQuestions(sections)

    const sectionErrors = validateSection(questionsToValidate)

    if (survey.collect_email && !collectedEmail.trim()) {
      sectionErrors["__email__"] = "Email is required."
    } else if (
      survey.collect_email &&
      collectedEmail.trim() &&
      !validateEmail(collectedEmail.trim())
    ) {
      sectionErrors["__email__"] = "Please enter a valid email address."
    }

    if (Object.keys(sectionErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...sectionErrors }))
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = { answers }
      if (survey.collect_email && collectedEmail.trim()) {
        body.email = collectedEmail.trim()
      }

      const res = await fetch(`/api/surveys/${survey.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(
          (data as { error?: string }).error ?? "Failed to submit. Please try again."
        )
        return
      }

      router.push(`/s/${survey.slug}/thank-you`)
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Survey header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{survey.title}</h1>
        {survey.description && (
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            {survey.description}
          </p>
        )}
      </div>

      {/* Email collection */}
      {survey.collect_email && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="survey-email">
                Your email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="survey-email"
                type="email"
                data-testid="survey-email-input"
                placeholder="you@example.com"
                value={collectedEmail}
                onChange={(e) => {
                  setCollectedEmail(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next["__email__"]
                    return next
                  })
                }}
                error={errors["__email__"]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress bar for multi-section surveys */}
      {isMultiSection && (
        <div className="mb-6">
          <SurveyProgressBar current={currentSectionIndex + 1} total={sections.length} />
        </div>
      )}

      {/* Section card */}
      <Card>
        {(currentSection?.title || currentSection?.description) && (
          <CardHeader>
            {currentSection.title && (
              <CardTitle className="text-lg">{currentSection.title}</CardTitle>
            )}
            {currentSection.description && (
              <CardDescription>{currentSection.description}</CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className={currentSection?.title || currentSection?.description ? "pt-0" : "pt-6"}>
          <div className="space-y-6">
            {(isMultiSection ? currentQuestions : getAllQuestions(sections)).map((question) => (
              <QuestionInput
                key={question.id}
                question={question}
                value={answers[question.id] ?? (question.type === "multiple_choice" ? [] : "")}
                onChange={(val) => handleAnswerChange(question.id, val)}
                error={errors[question.id]}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit error */}
      {submitError && (
        <p className="mt-4 text-sm text-destructive text-center">{submitError}</p>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {isMultiSection && currentSectionIndex > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            data-testid="survey-back-btn"
          >
            Back
          </Button>
        ) : (
          <span />
        )}

        {isMultiSection && !isLastSection ? (
          <Button
            type="button"
            onClick={handleNext}
            data-testid="survey-next-btn"
          >
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            loading={loading}
            data-testid="survey-submit-btn"
          >
            {loading ? "Submitting…" : "Submit"}
          </Button>
        )}
      </div>
    </form>
  )
}
