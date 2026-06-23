import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"

export const runtime = "nodejs"
export const maxDuration = 300

const DEEPSEEK_MODELS = ["deepseek-v4-flash"]
const DEEPSEEK_BASE = "https://api.deepseek.com"

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

SOCIAL MEDIA ICONS (important):
For social media links, use inline SVG icons — NOT emoji, NOT text, NOT external images. Here are the SVGs to use:
- Instagram: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
- Facebook: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
- Twitter/X: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
- LinkedIn: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
- YouTube: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
- WhatsApp: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>

Always use these inline SVGs for social links. Style them with CSS (color, size). Never use emoji like 📷 or text-only labels for social media.

CONTACT FORMS (very important):
Every website MUST include a contact/enquiry form section. Use these exact field names:
- <input name="name" type="text" required placeholder="Your Name">
- <input name="email" type="email" required placeholder="Your Email">
- <input name="phone" type="tel" placeholder="Phone Number">
- <textarea name="message" required placeholder="Your Message"></textarea>
- <button type="submit">Send Message</button>
Wrap in a <form> tag (no action attribute needed — it's handled automatically).
Style the form beautifully — it's a key part of the website.

BOOKING (optional):
If the user mentions appointments, bookings, scheduling, or reservations, include a booking section with a prominent "Book Now" button that links to "/book". This connects to their built-in booking system.
If the user hasn't mentioned booking, do NOT include it — stick to a contact form.

EDITABLE MARKERS (important):
On every text element and image that the user might want to edit, add these attributes:
- data-s9-edit="unique-key" (e.g. "hero-heading", "about-text", "feature-1", "hero-image")
- data-s9-type="text" for text elements, data-s9-type="image" for <img> tags

This lets the user click-to-edit in the visual editor. Cover all headings, paragraphs, images, and feature cards.

No explanation, no markdown fences. Output ONLY the HTML document.`

/**
 * POST /api/build/ai
 * Conversational AI website builder — runs on DeepSeek (cheap). Gemini is
 * reserved for logo generation only.
 */
export async function POST(req: Request) {
  try {
    const owner = await getOwnerContext()
    if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

    const deepseekKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekKey) {
      return NextResponse.json({ error: "No AI keys configured." }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const prompt = String(body.prompt ?? "").trim()
    if (!prompt) {
      return NextResponse.json({ error: "Describe what you want." }, { status: 400 })
    }

    const currentHtml = body.currentHtml ? String(body.currentHtml) : null
    const referenceHtml = body.referenceHtml ? String(body.referenceHtml) : null
    const colorPalette = body.colorPalette ?? null
    const logoUrl = body.logoUrl ? String(body.logoUrl) : null

    let userMessage: string
    if (currentHtml) {
      userMessage = `Here is the current website HTML:\n\n${currentHtml}\n\nUser's request: ${prompt}\n\nApply the requested changes and return the COMPLETE updated HTML document. Keep all existing data-s9-edit and data-s9-type attributes, and add them to any new elements. Return ONLY the full HTML document.`
    } else {
      const extras: string[] = []

      if (referenceHtml) {
        const truncated = referenceHtml.slice(0, 3000)
        extras.push(`\nSTYLE REFERENCE: Here is a website the user likes the style of. Match its visual approach (layout rhythm, whitespace, typography feel, color usage patterns) but create ORIGINAL content and structure:\n${truncated}\n`)
      }

      if (colorPalette) {
        extras.push(`\nCOLOR PALETTE (use these exact colors throughout the design):
- Primary: ${colorPalette.primary}
- Secondary: ${colorPalette.secondary}
- Accent: ${colorPalette.accent}
- Background: ${colorPalette.background}
- Text: ${colorPalette.text}
- Muted: ${colorPalette.muted}\n`)
      }

      if (logoUrl) {
        extras.push(`\nLOGO: Include this logo image prominently in the header/navigation area:
<img src="${logoUrl}" alt="${owner.tenant.name} logo" style="height: 48px; width: auto;">\n`)
      }

      userMessage = `Create a single-page website based on this description:\n\n${prompt}\n\nThe business/site name is "${owner.tenant.name}". Make it look premium, modern, and unique — NOT like a generic template.${extras.join("")}\nReturn ONLY the complete HTML document.`
    }

    // -- DeepSeek provider (OpenAI-compatible) ---------------------------------
    async function tryDeepSeek(model: string): Promise<string> {
      const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userMessage },
          ],
          max_tokens: 32768,
          temperature: 0.8,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw Object.assign(new Error(err?.error?.message ?? `HTTP ${res.status}`), { status: res.status })
      }
      const data = await res.json()
      return cleanHtml(data.choices?.[0]?.message?.content ?? "")
    }

    function cleanHtml(raw: string): string {
      const html = raw.trim().replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim()
      if (!html || html.length < 100 || !html.includes("<")) {
        throw Object.assign(new Error("AI returned an unexpected result"), { status: 502 })
      }
      return html
    }

    // -- Build attempt list: DeepSeek only -------------------------------------
    type Attempt = { provider: string; model: string; fn: (m: string) => Promise<string> }
    const attempts: Attempt[] = []
    for (const m of DEEPSEEK_MODELS) attempts.push({ provider: "DeepSeek", model: m, fn: tryDeepSeek })

    for (let i = 0; i < attempts.length; i++) {
      const { provider, model, fn } = attempts[i]
      try {
        console.log(`[build/ai] Trying ${provider}/${model}...`)
        const html = await fn(model)
        console.log(`[build/ai] Success with ${provider}/${model} (${html.length} chars)`)
        return NextResponse.json({ html })
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status
        const message = (err as { message?: string })?.message ?? ""

        if (status === 422) {
          return NextResponse.json({ error: "AI declined. Try a different description." }, { status: 422 })
        }

        console.log(`[build/ai] ${provider}/${model} failed (${status}): ${message.slice(0, 120)}`)

        if (i < attempts.length - 1) continue

        if (status === 429) {
          return NextResponse.json({ error: "All AI models are busy. Please wait and try again." }, { status: 429 })
        }
        return NextResponse.json({ error: `Could not generate: ${message || "unknown error"}` }, { status: 502 })
      }
    }

    return NextResponse.json({ error: "No AI providers available." }, { status: 503 })
  } catch (outerErr: unknown) {
    console.error("[build/ai] Unexpected error:", outerErr)
    return NextResponse.json({ error: `Unexpected error: ${(outerErr as Error)?.message ?? "unknown"}` }, { status: 500 })
  }
}
