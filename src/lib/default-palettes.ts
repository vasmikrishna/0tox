import type { ColorPalette, ColorPaletteColors } from "@/types"

function palette(
  id: string,
  name: string,
  colors: ColorPaletteColors,
  industry: string,
  sortOrder: number,
): ColorPalette {
  return {
    id,
    name,
    colors,
    industry,
    sort_order: sortOrder,
    status: "approved",
    created_by: "system",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }
}

export const DEFAULT_PALETTES: ColorPalette[] = [
  palette("pal-midnight", "Midnight Indigo", {
    primary: "#1e1b4b",
    secondary: "#e0e7ff",
    accent: "#818cf8",
    background: "#0f0f1a",
    text: "#f0f0f5",
    muted: "#6b7280",
  }, "all", 1),

  palette("pal-ocean", "Ocean Breeze", {
    primary: "#1B3A6B",
    secondary: "#E8F0FE",
    accent: "#3b82f6",
    background: "#FFFFFF",
    text: "#1A1A2E",
    muted: "#6B7280",
  }, "all", 2),

  palette("pal-sunset", "Sunset Warm", {
    primary: "#b45309",
    secondary: "#fef3c7",
    accent: "#f59e0b",
    background: "#fffbeb",
    text: "#292524",
    muted: "#78716c",
  }, "restaurant", 3),

  palette("pal-rose", "Rose Garden", {
    primary: "#be185d",
    secondary: "#fce7f3",
    accent: "#ec4899",
    background: "#fdf8f5",
    text: "#1f1f1f",
    muted: "#9a8a94",
  }, "salon", 4),

  palette("pal-forest", "Forest Green", {
    primary: "#166534",
    secondary: "#dcfce7",
    accent: "#22c55e",
    background: "#FFFFFF",
    text: "#1a2e1a",
    muted: "#6b7c6b",
  }, "all", 5),

  palette("pal-charcoal", "Charcoal Mono", {
    primary: "#18181b",
    secondary: "#f4f4f5",
    accent: "#a1a1aa",
    background: "#FFFFFF",
    text: "#09090b",
    muted: "#71717a",
  }, "photography", 6),

  palette("pal-royal", "Royal Purple", {
    primary: "#6d28d9",
    secondary: "#ede9fe",
    accent: "#a78bfa",
    background: "#FFFFFF",
    text: "#1e1b4b",
    muted: "#7c7c8a",
  }, "saas", 7),

  palette("pal-coral", "Coral Pop", {
    primary: "#dc2626",
    secondary: "#fef2f2",
    accent: "#FF6B35",
    background: "#FFFFFF",
    text: "#1C1917",
    muted: "#78716c",
  }, "retail", 8),
]
