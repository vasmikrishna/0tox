/**
 * Core AI logo generation, shared by the owner builder route
 * (/api/build/generate-logo) and the superadmin tenant route
 * (/api/superadmin/tenants/[id]/logo/generate). Generates one or more distinct
 * SVG options, uploads each to R2, and returns their URLs + markup.
 */
import { GoogleGenAI } from "@google/genai"
import { uploadBufferToR2 } from "@/lib/r2"
import { getLogoStyle } from "@/lib/logo-styles"

// Gemini model for logo SVG generation. Override via env if it gets deprecated.
const LOGO_MODEL = process.env.GEMINI_LOGO_MODEL ?? "gemini-2.5-flash"

export const DEFAULT_LOGO_COUNT = 2
const MAX_COUNT = 4

export interface LogoOption {
  url: string
  svg: string
  style?: string
}

export interface GenerateLogosInput {
  tenantId: string
  businessName: string
  category?: string
  colors?: { primary: string; accent: string }
  style?: string
  count?: number
}

const SYSTEM = `You are an expert logo designer. Create a clean, professional SVG logo.

OUTPUT RULES (strict):
- Return ONLY a valid SVG string starting with <svg and ending with </svg>
- Use simple, scalable vector shapes — no raster images, no base64 data
- Keep it minimal and memorable — great logos are simple
- Use the provided colors for the design
- Include the business name or initials as text in the logo
- Use appropriate fonts via SVG text elements with font-family="system-ui, sans-serif"
- Make it work well at small sizes (favicon) and large sizes
- No markdown, no explanation — ONLY the raw SVG code`

// Gemini occasionally returns transient 503/UNAVAILABLE (high demand) or 429.
// A single blip used to fail the whole request; retry a few times with backoff.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const msg = String((err as Error)?.message ?? "")
      const transient = /\b(429|503|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED)\b/i.test(msg)
      if (!transient || i === attempts - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastErr
}

function buildPrompt(
  businessName: string,
  category: string,
  colors: { primary: string; accent: string },
  stylePrompt: string | undefined,
  variantIdx: number,
  count: number,
): string {
  return [
    `Create an SVG logo for "${businessName}" (industry: ${category}).`,
    `Use primary color ${colors.primary} and accent color ${colors.accent}.`,
    stylePrompt,
    count > 1
      ? `This is design option ${variantIdx + 1} of ${count} — make it visibly different from the other options in layout, composition, and mark.`
      : undefined,
    `Make it modern, clean, and professional.`,
  ].filter(Boolean).join("\n")
}

/**
 * Normalize the root <svg> so it always renders centered and scales to fill its
 * container: guarantee a viewBox (derive from width/height if absent), drop the
 * fixed pixel width/height so `object-contain` can size it, and center it via
 * preserveAspectRatio. Leaves the artwork untouched.
 */
export function normalizeLogoSvg(svg: string): string {
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0]
  if (!tag) return svg

  let next = tag
  if (!/viewBox\s*=/i.test(next)) {
    const w = next.match(/\bwidth\s*=\s*["']?([\d.]+)/i)?.[1]
    const h = next.match(/\bheight\s*=\s*["']?([\d.]+)/i)?.[1]
    if (w && h) next = next.replace(/<svg\b/i, `<svg viewBox="0 0 ${w} ${h}"`)
  }
  // Remove fixed pixel dimensions so the SVG scales to whatever box it's in.
  next = next.replace(/\s(width|height)\s*=\s*["'][^"']*["']/gi, "")
  if (!/preserveAspectRatio\s*=/i.test(next)) {
    next = next.replace(/<svg\b/i, `<svg preserveAspectRatio="xMidYMid meet"`)
  }
  return next === tag ? svg : svg.replace(tag, next)
}

async function generateOne(
  ai: GoogleGenAI,
  tenantId: string,
  userMessage: string,
  styleId: string | undefined,
): Promise<LogoOption> {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: LOGO_MODEL,
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM,
        maxOutputTokens: 8192,
        temperature: 0.9, // higher temp → more variety across the options
        // gemini-2.5-flash is a thinking model; thinking tokens count against
        // maxOutputTokens and were truncating/starving the SVG. Disable it so the
        // whole budget goes to the logo (also faster + cheaper).
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
  )

  let svg = (response.text ?? "").trim()
  svg = svg.replace(/^```(?:svg|xml)?\s*/i, "").replace(/\s*```$/i, "").trim()
  if (!svg.startsWith("<svg") || !svg.includes("</svg>")) {
    throw new Error("AI did not return valid SVG")
  }
  svg = normalizeLogoSvg(svg)

  const filename = `logo-${Date.now()}-${crypto.randomUUID()}.svg`
  const key = `builder/${tenantId}/logo/${filename}`
  const url = await uploadBufferToR2(Buffer.from(svg, "utf-8"), key, "image/svg+xml")
  return { url, svg, style: styleId }
}

/** Returns `true` when a Gemini key is configured. */
export function isLogoAiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY
}

/**
 * Generate `count` distinct logo options. Resilient: if some variants fail,
 * the successful ones are still returned. Throws only when none succeed.
 */
export async function generateLogoOptions(input: GenerateLogosInput): Promise<LogoOption[]> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) throw new Error("AI not configured")

  const businessName = (input.businessName || "Business").trim()
  const category = (input.category || "business").trim()
  const colors = input.colors ?? { primary: "#1B3A6B", accent: "#FF6B35" }
  const style = getLogoStyle(input.style)
  const count = Math.min(Math.max(Number(input.count) || DEFAULT_LOGO_COUNT, 1), MAX_COUNT)

  const ai = new GoogleGenAI({ apiKey: geminiKey })
  const settled = await Promise.allSettled(
    Array.from({ length: count }, (_, i) =>
      generateOne(
        ai,
        input.tenantId,
        buildPrompt(businessName, category, colors, style?.prompt, i, count),
        style?.id,
      )
    )
  )

  const options = settled
    .filter((r): r is PromiseFulfilledResult<LogoOption> => r.status === "fulfilled")
    .map(r => r.value)

  if (options.length === 0) {
    const firstErr = settled.find(r => r.status === "rejected") as PromiseRejectedResult | undefined
    throw new Error(String(firstErr?.reason?.message ?? firstErr?.reason ?? "unknown"))
  }
  return options
}
