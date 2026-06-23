"use client"

import { useState } from "react"
import { Builder } from "@/components/build/builder"
import { OnboardingWizard } from "@/components/build/onboarding-wizard"
import type { BusinessDetails } from "@/lib/onboarding"

interface BuildPageClientProps {
  initialDetails: BusinessDetails
  ownerName: string
  host: string
  onboardingComplete: boolean
}

export function BuildPageClient({
  initialDetails,
  ownerName,
  host,
  onboardingComplete,
}: BuildPageClientProps) {
  const [showBuilder, setShowBuilder] = useState(onboardingComplete)
  const [generatedHtml, setGeneratedHtml] = useState("")

  if (!showBuilder) {
    return (
      <OnboardingWizard
        initialDetails={initialDetails}
        onComplete={(html) => {
          setGeneratedHtml(html)
          setShowBuilder(true)
        }}
      />
    )
  }

  return (
    <Builder
      initialDetails={initialDetails}
      ownerName={ownerName}
      host={host}
      initialHtml={generatedHtml || undefined}
    />
  )
}
