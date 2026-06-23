/**
 * Logo style presets shared by the builder UI (the style picker row) and the
 * /api/build/generate-logo route (which turns the chosen style into a prompt).
 * Keep the ids stable — they are persisted on brand assets.
 */
export interface LogoStyle {
  id: string
  label: string
  /** Short helper text shown under the preset card. */
  description: string
  /** Appended to the logo prompt to steer the design toward this style. */
  prompt: string
}

export const LOGO_STYLES: LogoStyle[] = [
  {
    id: "wordmark",
    label: "Minimal wordmark",
    description: "Clean text-only logotype",
    prompt:
      "Style: a minimal WORDMARK — the business name set in a clean, modern typeface. No icon. Tasteful letter spacing, maybe one subtle accent (a colored dot, underline, or single highlighted letter).",
  },
  {
    id: "icon-text",
    label: "Icon + text",
    description: "Symbol beside the name",
    prompt:
      "Style: an ICON + TEXT lockup — a simple geometric symbol to the left of the business name. The icon should hint at the industry but stay abstract and scalable.",
  },
  {
    id: "emblem",
    label: "Badge / emblem",
    description: "Contained crest or badge",
    prompt:
      "Style: a BADGE / EMBLEM — the name and a small mark enclosed in a contained shape (circle, shield, or rounded badge). Balanced and centered, works as a stamp.",
  },
  {
    id: "playful",
    label: "Playful",
    description: "Friendly, rounded, colorful",
    prompt:
      "Style: PLAYFUL — friendly rounded forms, a bit of personality, confident use of the accent color. Approachable but still professional.",
  },
  {
    id: "monogram",
    label: "Monogram",
    description: "Initials-based mark",
    prompt:
      "Style: a MONOGRAM — build the mark from the business initials (1–3 letters) combined into a single tidy symbol. Optionally show the full name small beneath it.",
  },
]

export function getLogoStyle(id: string | undefined): LogoStyle | undefined {
  return LOGO_STYLES.find((s) => s.id === id)
}
