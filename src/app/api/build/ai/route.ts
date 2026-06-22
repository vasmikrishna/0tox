import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getOwnerContext } from "@/lib/build-owner"

export const runtime = "nodejs"
export const maxDuration = 300

const MODEL = "gemini-2.5-flash"

const SYSTEM = `You are an expert web designer who builds stunning, modern single-page websites.

OUTPUT RULES (strict):
- Return ONLY a complete HTML document starting with <!DOCTYPE html>
- Put ALL CSS in a single <style> tag inside <head>
- Do NOT include any <script> tags or JavaScript
- Do NOT use external fonts, CDNs, or frameworks
- Use high-quality Unsplash images via https://images.unsplash.com URLs for realistic visuals
- Make it fully responsive and beautiful on mobile
- Use modern CSS: gradients, grid, flexbox, clamp(), smooth transitions
- Keep the design premium and polished — NOT generic/templated

EDITABLE MARKERS (important):
On every text element and image that the user might want to edit, add these attributes:
- data-s9-edit="unique-key" (e.g. "hero-heading", "about-text", "feature-1", "hero-image")
- data-s9-type="text" for text elements, data-s9-type="image" for <img> tags

This lets the user click-to-edit in the visual editor. Cover all headings, paragraphs, images, and feature cards.

No explanation, no markdown fences. Output ONLY the HTML document.`

/**
 * POST /api/build/ai
 * Conversational AI website builder — Bolt-style.
 *
 * Body: { prompt: string, currentHtml?: string }
 *  - First call: prompt describes the business/site, no currentHtml
 *  - Follow-up: prompt describes the change, currentHtml is the current state
 *
 * Returns: { html: string } — the full HTML document
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY." }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const prompt = String(body.prompt ?? "").trim()
  if (!prompt) {
    return NextResponse.json({ error: "Describe what you want." }, { status: 400 })
  }

  const currentHtml = body.currentHtml ? String(body.currentHtml) : null

  let userMessage: string
  if (currentHtml) {
    userMessage = `Here is the current website HTML:\n\n${currentHtml}\n\nUser's request: ${prompt}\n\nApply the requested changes and return the COMPLETE updated HTML document. Keep all existing data-s9-edit and data-s9-type attributes, and add them to any new elements. Return ONLY the full HTML document.`
  } else {
    userMessage = `Create a single-page website based on this description:\n\n${prompt}\n\nThe business/site name is "${owner.tenant.name}". Make it look premium, modern, and unique — NOT like a generic template. Return ONLY the complete HTML document.`
  }

  const ai = new GoogleGenAI({ apiKey })

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM,
        maxOutputTokens: 32768,
        temperature: 0.8,
      },
    })

    if (response.promptFeedback?.blockReason) {
      return NextResponse.json({ error: "AI declined. Try a different description." }, { status: 422 })
    }

    let html = (response.text ?? "").trim()
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim()

    if (!html || html.length < 100 || !html.includes("<")) {
      return NextResponse.json({ error: "AI returned an unexpected result. Try again." }, { status: 502 })
    }

    return NextResponse.json({ html })
  } catch {
    return NextResponse.json({ error: "Could not generate. Please try again." }, { status: 502 })
  }
}
