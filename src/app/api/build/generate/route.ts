import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getOwnerContext } from "@/lib/build-owner"
import { buildAiWebsitePrompt, splitAiHtml } from "@/lib/ai-website-prompt"
import type { BusinessDetails } from "@/lib/onboarding"

// Website generation can take up to a minute on a large page — give the
// serverless function room (Netlify/Next default is shorter).
export const runtime = "nodejs"
export const maxDuration = 300

const MODEL = "gemini-2.5-flash"

/**
 * POST /api/build/generate
 * Generates a complete website for the owner's business by calling the Google
 * Gemini API directly (no copy-paste). Returns the raw HTML document plus the
 * split { html, css } pair the page builder stores.
 *
 * Body (optional): { details: Partial<BusinessDetails> } — last-minute edits
 * to merge over the saved business details. Falls back to whatever the owner
 * already saved in the builder.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI website generation isn't configured yet. Add GEMINI_API_KEY to your environment." },
      { status: 503 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const incoming = (body?.details ?? {}) as Partial<BusinessDetails>
  const saved = ((owner.tenant.settings as Record<string, unknown>)?.business ?? {}) as BusinessDetails

  const business: BusinessDetails = {
    ...saved,
    ...incoming,
    name: incoming.name || saved.name || owner.tenant.name,
  }
  if (!business.name?.trim()) {
    return NextResponse.json({ error: "Add your business details first" }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildAiWebsitePrompt(business),
      config: {
        systemInstruction:
          "You are an expert web designer and front-end developer. Follow the user's brief exactly and output only a single, complete, self-contained HTML document — no explanation, no markdown fences.",
        maxOutputTokens: 32768,
        temperature: 0.8,
      },
    })

    if (response.promptFeedback?.blockReason) {
      return NextResponse.json(
        { error: "The AI declined to generate this site. Try adjusting your business details." },
        { status: 422 },
      )
    }

    const raw = (response.text ?? "").trim()
    const { html, css } = splitAiHtml(raw)
    if (!html || html.length < 40) {
      return NextResponse.json({ error: "The AI returned an unexpected result. Please try again." }, { status: 502 })
    }

    return NextResponse.json({ html, css, raw })
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 429) {
      return NextResponse.json({ error: "The AI is busy right now. Please try again in a moment." }, { status: 429 })
    }
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "AI credentials are invalid. Check GEMINI_API_KEY." }, { status: 502 })
    }
    return NextResponse.json({ error: "Could not generate your website. Please try again." }, { status: 502 })
  }
}
