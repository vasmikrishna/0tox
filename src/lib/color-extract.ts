import type { ColorPaletteColors } from "@/types"

interface RGB { r: number; g: number; b: number }

function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
}

function luminance({ r, g, b }: RGB): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function quantizeColors(pixels: RGB[], maxColors: number): RGB[] {
  if (pixels.length <= maxColors) return pixels

  const buckets: Map<string, { sum: RGB; count: number }> = new Map()
  const shift = 5

  for (const px of pixels) {
    const key = `${px.r >> shift},${px.g >> shift},${px.b >> shift}`
    const existing = buckets.get(key)
    if (existing) {
      existing.sum.r += px.r
      existing.sum.g += px.g
      existing.sum.b += px.b
      existing.count++
    } else {
      buckets.set(key, { sum: { r: px.r, g: px.g, b: px.b }, count: 1 })
    }
  }

  const averaged = Array.from(buckets.values())
    .map(({ sum, count }) => ({
      color: { r: Math.round(sum.r / count), g: Math.round(sum.g / count), b: Math.round(sum.b / count) },
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return averaged.slice(0, maxColors).map((b) => b.color)
}

export function extractColorsFromCanvas(canvas: HTMLCanvasElement): ColorPaletteColors {
  const ctx = canvas.getContext("2d")
  if (!ctx) return defaultPalette()

  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels: RGB[] = []

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i]
    const g = imageData.data[i + 1]
    const b = imageData.data[i + 2]
    const a = imageData.data[i + 3]
    if (a < 128) continue
    if (r > 240 && g > 240 && b > 240) continue
    if (r < 15 && g < 15 && b < 15) continue
    pixels.push({ r, g, b })
  }

  if (pixels.length < 10) return defaultPalette()

  const dominant = quantizeColors(pixels, 8)

  const sorted = [...dominant].sort((a, b) => {
    const freqDiff = pixels.filter((p) => colorDistance(p, b) < 40).length -
      pixels.filter((p) => colorDistance(p, a) < 40).length
    return freqDiff
  })

  const primary = sorted[0] ?? { r: 27, g: 58, b: 107 }

  const mostSaturated = [...dominant].sort((a, b) => saturation(b) - saturation(a))
  let accent = mostSaturated.find((c) => colorDistance(c, primary) > 80) ?? mostSaturated[0] ?? { r: 255, g: 107, b: 53 }

  if (colorDistance(accent, primary) < 40) {
    accent = { r: 255, g: 107, b: 53 }
  }

  const isLight = luminance(primary) > 128
  const background = isLight ? { r: 255, g: 255, b: 255 } : { r: 250, g: 250, b: 250 }
  const text = isLight ? { r: 26, g: 26, b: 46 } : { r: 26, g: 26, b: 46 }

  const secondary = {
    r: Math.min(255, Math.round(primary.r * 0.15 + 217)),
    g: Math.min(255, Math.round(primary.g * 0.15 + 217)),
    b: Math.min(255, Math.round(primary.b * 0.15 + 217)),
  }

  return {
    primary: rgbToHex(primary),
    secondary: rgbToHex(secondary),
    accent: rgbToHex(accent),
    background: rgbToHex(background),
    text: rgbToHex(text),
    muted: "#6B7280",
  }
}

function defaultPalette(): ColorPaletteColors {
  return {
    primary: "#1B3A6B",
    secondary: "#E8F0FE",
    accent: "#FF6B35",
    background: "#FFFFFF",
    text: "#1A1A2E",
    muted: "#6B7280",
  }
}

export function extractColorsFromImage(imageUrl: string): Promise<ColorPaletteColors> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const size = 100
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(defaultPalette()); return }
      ctx.drawImage(img, 0, 0, size, size)
      resolve(extractColorsFromCanvas(canvas))
    }
    img.onerror = () => resolve(defaultPalette())
    img.src = imageUrl
  })
}
