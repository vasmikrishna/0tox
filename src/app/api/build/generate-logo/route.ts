import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getOwnerContext } from "@/lib/build-owner"
import { uploadBufferToR2 } from "@/lib/r2"

export const runtime = "nodejs"
export const maxDuration = 120

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

export async function POST(req: Request) {
  try {
    const owner = await getOwnerContext()
    if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const businessName = String(body.businessName ?? owner.tenant.name).trim()
    const category = String(body.category ?? "business").trim()
    const colors = body.colors ?? { primary: "#1B3A6B", accent: "#FF6B35" }

    const userMessage = `Create an SVG logo for "${businessName}" (industry: ${category}).
Use primary color ${colors.primary} and accent color ${colors.accent}.
Make it modern, clean, and professional.`

    const ai = new GoogleGenAI({ apiKey: geminiKey })
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: { systemInstruction: SYSTEM, maxOutputTokens: 8192, temperature: 0.7 },
    })

    let svg = (response.text ?? "").trim()
    svg = svg.replace(/^```(?:svg|xml)?\s*/i, "").replace(/\s*```$/i, "").trim()

    if (!svg.startsWith("<svg") || !svg.includes("</svg>")) {
      return NextResponse.json({ error: "AI did not return valid SVG" }, { status: 502 })
    }

    const tenantId = owner.tenant.id
    const filename = `logo-${Date.now()}.svg`
    const buffer = Buffer.from(svg, "utf-8")
    const key = `builder/${tenantId}/logo/${filename}`
    const url = await uploadBufferToR2(buffer, key, "image/svg+xml")

    return NextResponse.json({ url, svg })
  } catch (err: unknown) {
    console.error("[build/generate-logo]", err)
    return NextResponse.json(
      { error: `Logo generation failed: ${(err as Error)?.message ?? "unknown"}` },
      { status: 500 }
    )
  }
}
