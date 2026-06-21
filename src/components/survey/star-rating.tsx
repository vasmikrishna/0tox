"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const effective = hovered > 0 ? hovered : value

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
      data-testid="star-rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          data-testid={`star-${star}`}
          className={cn(
            "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
            effective >= star ? "text-amber-400" : "text-muted-foreground/30"
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            className="h-7 w-7"
            fill={effective >= star ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value} / 5
        </span>
      )}
    </div>
  )
}
