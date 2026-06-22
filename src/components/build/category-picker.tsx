"use client"

import { CATEGORIES } from "@/lib/curated-templates"

export function CategoryPicker({ onSelect }: { onSelect: (category: string) => void }) {
  return (
    <div className="space-y-4" data-testid="build-category">
      <h2 className="text-center text-lg font-semibold">What kind of website do you need?</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            data-testid={`category-${cat.key}`}
            onClick={() => onSelect(cat.key)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-brand hover:bg-accent"
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="font-semibold">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
