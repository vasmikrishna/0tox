"use client"

import { Check } from "lucide-react"
import { CURATED_TEMPLATES } from "@/lib/curated-templates"

export function TemplateGallery({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (key: string) => void
}) {
  return (
    <div className="space-y-4" data-testid="build-template-gallery">
      <h2 className="text-center text-lg font-semibold">Choose a design</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {CURATED_TEMPLATES.map((tpl) => {
          const isOn = selected === tpl.key
          return (
            <button
              key={tpl.key}
              type="button"
              data-testid={`tpl-${tpl.key}`}
              onClick={() => onSelect(tpl.key)}
              className={`overflow-hidden rounded-xl border text-left transition-all ${
                isOn
                  ? "border-brand ring-2 ring-brand/40"
                  : "border-border hover:border-brand/60"
              }`}
            >
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tpl.preview}
                  alt={tpl.name}
                  className="h-full w-full object-cover"
                />
                {isOn && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-background">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{tpl.name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{tpl.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
