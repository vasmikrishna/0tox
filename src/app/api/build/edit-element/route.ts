import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getOwnerContext } from "@/lib/build-owner"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/build/edit-element
 * AI-assisted rewrite of a single editable element.
 *
 * Body: { currentContent: string, instruction: string, businessName?: string }
 * Returns: { content: string }
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const currentContent = String(body.currentContent ?? "").trim()
  const instruction = String(body.instruction ?? "").trim()
  const businessName = String(body.businessName ?? owner.tenant.name ?? "")

  if (!instruction) {
    return NextResponse.json({ error: "Describe what you want to change." }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const prompt = `You are editing a single element on a small business website for "${businessName}".

CURRENT CONTENT:
${currentContent}

USER'S REQUEST:
${instruction}

Return ONLY the updated HTML for this element. Keep the same HTML structure (same tags). No wrapping tags like <html> or <body>. No explanation, no markdown fences.`

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 2048, temperature: 0.7 },
    })

    const content = (response.text ?? "").trim()
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    if (!content) {
      return NextResponse.json({ error: "AI returned empty content." }, { status: 502 })
    }

    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: "Could not edit. Please try again." }, { status: 502 })
  }
}
