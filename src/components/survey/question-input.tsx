"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { StarRating } from "./star-rating"
import type { SurveyQuestion } from "@/types"

interface QuestionInputProps {
  question: SurveyQuestion
  value: string | string[]
  onChange: (value: string | string[]) => void
  error?: string
}

export function QuestionInput({ question, value, onChange, error }: QuestionInputProps) {
  const stringVal = typeof value === "string" ? value : ""
  const arrayVal = Array.isArray(value) ? value : []

  function handleMultipleChoiceChange(option: string, checked: boolean) {
    if (checked) {
      onChange([...arrayVal, option])
    } else {
      onChange(arrayVal.filter((v) => v !== option))
    }
  }

  const inputId = `question-${question.id}`

  return (
    <fieldset
      className="space-y-2"
      data-testid={`question-${question.id}`}
    >
      <legend className="sr-only">{question.label}</legend>

      {/* Label row */}
      <div className="space-y-0.5">
        <Label
          htmlFor={
            question.type === "single_choice" ||
            question.type === "multiple_choice" ||
            question.type === "rating"
              ? undefined
              : inputId
          }
          className="text-sm font-medium"
        >
          {question.label}
          {question.required && (
            <span className="ml-1 text-destructive" aria-label="required">
              *
            </span>
          )}
        </Label>
        {question.description && (
          <p className="text-xs text-muted-foreground">{question.description}</p>
        )}
      </div>

      {/* Input widget */}
      <div>
        {question.type === "short_text" && (
          <Input
            id={inputId}
            type="text"
            data-testid={`input-${question.id}`}
            placeholder={question.config?.placeholder ?? ""}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        )}

        {question.type === "long_text" && (
          <Textarea
            id={inputId}
            data-testid={`textarea-${question.id}`}
            placeholder={question.config?.placeholder ?? ""}
            rows={4}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        )}

        {question.type === "email" && (
          <Input
            id={inputId}
            type="email"
            data-testid={`input-${question.id}`}
            placeholder={question.config?.placeholder ?? "you@example.com"}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        )}

        {question.type === "phone" && (
          <Input
            id={inputId}
            type="tel"
            data-testid={`input-${question.id}`}
            placeholder={question.config?.placeholder ?? "+1 (555) 000-0000"}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        )}

        {question.type === "number" && (
          <Input
            id={inputId}
            type="number"
            data-testid={`input-${question.id}`}
            placeholder={question.config?.placeholder ?? ""}
            min={question.config?.min}
            max={question.config?.max}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        )}

        {question.type === "date" && (
          <Input
            id={inputId}
            type="date"
            data-testid={`input-${question.id}`}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        )}

        {question.type === "single_choice" && (
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={question.label}
            data-testid={`radiogroup-${question.id}`}
          >
            {(question.options ?? []).map((option) => {
              const isSelected = stringVal === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`radio-${question.id}-${option}`}
                  onClick={() => onChange(option)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        {question.type === "multiple_choice" && (
          <div
            className="space-y-2"
            data-testid={`checkboxgroup-${question.id}`}
          >
            {(question.options ?? []).map((option) => {
              const isChecked = arrayVal.includes(option)
              const checkboxId = `${inputId}-${option}`
              return (
                <label
                  key={option}
                  htmlFor={checkboxId}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    isChecked
                      ? "border-foreground bg-muted"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    data-testid={`checkbox-${question.id}-${option}`}
                    checked={isChecked}
                    onChange={(e) => handleMultipleChoiceChange(option, e.target.checked)}
                    className="h-4 w-4 accent-foreground rounded"
                  />
                  {option}
                </label>
              )
            })}
          </div>
        )}

        {question.type === "dropdown" && (
          <select
            id={inputId}
            data-testid={`select-${question.id}`}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <option value="">Select an option…</option>
            {(question.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {question.type === "rating" && (
          <StarRating
            value={stringVal ? parseInt(stringVal, 10) : 0}
            onChange={(val) => onChange(String(val))}
          />
        )}

        {question.type === "file_upload" && (
          <input
            id={inputId}
            type="file"
            data-testid={`file-${question.id}`}
            accept={question.config?.accept}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(e) => {
              const file = e.target.files?.[0]
              onChange(file ? file.name : "")
            }}
          />
        )}
      </div>

      {/* Error message (for types that don't use Input's built-in error) */}
      {error &&
        question.type !== "short_text" &&
        question.type !== "long_text" &&
        question.type !== "email" &&
        question.type !== "phone" &&
        question.type !== "number" &&
        question.type !== "date" && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
    </fieldset>
  )
}
