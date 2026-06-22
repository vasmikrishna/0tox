import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getOwnerContext } from "@/lib/build-owner"
import { renderCuratedTemplate, extractEditZones, getCuratedTemplate } from "@/lib/curated-templates"
import type { BusinessDetails } from "@/lib/onboarding"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * POST /api/build/generate-template
 * Renders a curated template and fills its editable zones with AI-generated
 * copy tailored to the owner's business details and category.
 *
 * Body: { templateKey: string, category: string, details?: Partial<BusinessDetails> }
 * Returns: { html: string, css: string }
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY." }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const templateKey = String(body.templateKey ?? "bold")
  const category = String(body.category ?? "other")
  const incoming = (body.details ?? {}) as Partial<BusinessDetails>
  const saved = ((owner.tenant.settings as Record<string, unknown>)?.business ?? {}) as BusinessDetails

  const business: BusinessDetails = {
    ...saved,
    ...incoming,
    name: incoming.name || saved.name || owner.tenant.name,
  }
  if (!business.name?.trim()) {
    return NextResponse.json({ error: "Add your business details first" }, { status: 400 })
  }

  getCuratedTemplate(templateKey)
  const { html: templateHtml, css } = renderCuratedTemplate(templateKey, category)
  const zones = extractEditZones(templateHtml)

  const ai = new GoogleGenAI({ apiKey })

  const businessLines: string[] = []
  businessLines.push(`Business name: ${business.name}`)
  if (business.category) businessLines.push(`Type: ${business.category}`)
  if (business.tagline) businessLines.push(`Tagline: ${business.tagline}`)
  if (business.about) businessLines.push(`About: ${business.about}`)
  if (business.services?.length) businessLines.push(`Services: ${business.services.filter(Boolean).join(", ")}`)
  if (business.address) businessLines.push(`Address: ${business.address}`)
  if (business.hours) businessLines.push(`Hours: ${business.hours.replace(/\n/g, "; ")}`)
  if (business.phone) businessLines.push(`Phone: ${business.phone}`)
  if (business.whatsapp) businessLines.push(`WhatsApp: ${business.whatsapp}`)
  if (business.email) businessLines.push(`Email: ${business.email}`)

  const prompt = `You are a website copywriter for small businesses. Write engaging, professional copy to fill a website template.

BUSINESS DETAILS:
${businessLines.join("\n")}

WEBSITE CATEGORY: ${category}

CONTENT ZONES TO FILL (return a JSON object with these exact keys):
${zones.map((z) => {
  if (z === "hero-heading") return `- "hero-heading": The business name or a short headline (max 6 words)`
  if (z === "hero-tagline") return `- "hero-tagline": A catchy one-line tagline (max 12 words)`
  if (z === "about-heading") return `- "about-heading": Section heading for "about" (2-3 words)`
  if (z === "about-body") return `- "about-body": 2-3 engaging sentences about the business`
  if (z === "services-heading") return `- "services-heading": Section heading for services (2-3 words)`
  if (z.startsWith("service-")) return `- "${z}": A service card with <h3>Service Name</h3><p>One-sentence description</p>`
  if (z === "contact-heading") return `- "contact-heading": Section heading for contact (2-3 words)`
  if (z === "contact-body") return `- "contact-body": Address, phone, email, and hours formatted with <br> tags`
  return `- "${z}": Appropriate content for this section`
}).join("\n")}

RULES:
- Write naturally. Do NOT use placeholder text like "lorem ipsum".
- Keep copy concise and friendly.
- For the contact-body, include the actual address, phone, WhatsApp, email, and hours from the business details above. Format with <br> line breaks.
- Service cards must use <h3> for the name and <p> for the description.
- Return ONLY valid JSON. No markdown fences, no explanation.`

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 4096, temperature: 0.7 },
    })

    const raw = (response.text ?? "").trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    let filled: Record<string, string>
    try {
      filled = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "AI returned invalid content. Please try again." }, { status: 502 })
    }

    let finalHtml = templateHtml
    for (const [key, value] of Object.entries(filled)) {
      if (typeof value !== "string") continue
      const isImage = templateHtml.includes(`data-s9-edit="${key}" data-s9-type="image"`)
      if (isImage) {
        finalHtml = finalHtml.replace(
          new RegExp(`(data-s9-edit="${key}"[^>]*src=")[^"]*(")`),
          `$1${value}$2`,
        )
      } else {
        finalHtml = finalHtml.replace(
          new RegExp(`(data-s9-edit="${key}"[^>]*>)[\\s\\S]*?(<\\/)`),
          `$1${value}$2`,
        )
      }
    }

    return NextResponse.json({ html: finalHtml, css })
  } catch {
    return NextResponse.json({ error: "Could not generate content. Please try again." }, { status: 502 })
  }
}
