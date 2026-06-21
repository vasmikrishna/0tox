/**
 * Builds the copy-paste prompt for the "build with AI" path. The owner copies
 * this into ChatGPT / Claude, gets a single HTML document back, and pastes it
 * into the builder — which sanitizes it and saves it as their homepage.
 *
 * The prompt is engineered to return ONE self-contained HTML document (inline
 * CSS, no external assets, no <script>) so it survives the page sanitizer and
 * renders correctly on the public subdomain.
 */

import type { BusinessDetails } from "@/lib/onboarding"

export function buildAiWebsitePrompt(b: BusinessDetails): string {
  const lines: string[] = []
  lines.push(`Business name: ${b.name}`)
  if (b.category) lines.push(`Type of business: ${b.category}`)
  if (b.tagline) lines.push(`Tagline: ${b.tagline}`)
  if (b.about) lines.push(`About: ${b.about}`)
  if (b.services?.length) lines.push(`Services / offerings: ${b.services.filter(Boolean).join(", ")}`)
  if (b.address) lines.push(`Address: ${b.address}`)
  if (b.hours) lines.push(`Opening hours: ${b.hours.replace(/\n/g, "; ")}`)
  if (b.phone) lines.push(`Phone: ${b.phone}`)
  if (b.whatsapp) lines.push(`WhatsApp: ${b.whatsapp}`)
  if (b.email) lines.push(`Email: ${b.email}`)

  return `You are an expert web designer. Build a beautiful, modern, single-page website for my business.

BUSINESS DETAILS
${lines.join("\n")}

REQUIREMENTS
- Return ONE complete, self-contained HTML document and nothing else.
- Put ALL styling in a single <style> tag in the <head>. Do not use external CSS, fonts, or frameworks.
- Do NOT include any <script> tags or JavaScript.
- Do NOT reference external images or assets (no <img src> to other sites). Use CSS gradients/colors for visuals.
- Make it fully responsive and great on mobile.
- Include these sections: a hero with the business name + tagline, an about section, the services/offerings, opening hours (if provided), and a contact section with address, a "Call" link (tel:), and a WhatsApp link (https://wa.me/<number>).
- Use a clean, professional color palette that suits this type of business.
- Keep the copy friendly and concise; you may improve the wording I gave you.

Output ONLY the HTML document, starting with <!DOCTYPE html>. No explanation, no markdown code fences.`
}

/**
 * Split an AI-generated HTML document into the `{ html, css }` pair the page
 * builder stores. The public renderer strips <style>/<head> tags, so we lift
 * the CSS out of any <style> blocks and keep only the <body> markup as HTML.
 *
 * Tolerant of common LLM output quirks: markdown ```html fences and a leading
 * doctype/preamble. Falls back to treating the whole input as body HTML.
 */
export function splitAiHtml(raw: string): { html: string; css: string } {
  let src = (raw ?? "").trim()

  // Strip markdown code fences if the model wrapped the output.
  src = src.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim()

  // Pull every <style>…</style> block into the CSS bucket.
  const css: string[] = []
  src = src.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_m, body) => {
    css.push(String(body).trim())
    return ""
  })

  // Prefer the <body> contents; otherwise drop the doctype/html/head wrappers.
  let html: string
  const bodyMatch = src.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    html = bodyMatch[1].trim()
  } else {
    html = src
      .replace(/<!doctype[^>]*>/gi, "")
      .replace(/<\/?html\b[^>]*>/gi, "")
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body\b[^>]*>/gi, "")
      .trim()
  }

  return { html, css: css.join("\n\n") }
}
