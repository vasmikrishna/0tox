/**
 * Seed script — generates 100 page templates via DeepSeek and inserts into Supabase.
 *
 * Usage:
 *   set -a && source .env.local && set +a && pnpm exec tsx src/scripts/seed-templates.ts
 *
 * Required env vars (from .env.local):
 *   DEEPSEEK_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"
import { TEMPLATE_DEFINITIONS, type TemplateDef } from "./template-definitions"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!
const DEEPSEEK_BASE = "https://api.deepseek.com"
const BATCH_SIZE = 3
const CHECKPOINT_FILE = resolve(__dirname, "../../.seed-checkpoint.json")

const STYLE_HINTS: Record<string, string> = {
  modern: "Use a clean sans-serif font, vibrant accent color, generous whitespace, rounded corners, and subtle shadows. Light background.",
  minimal: "Ultra-clean design. Lots of whitespace, thin borders, muted colors, small uppercase headings. Helvetica/system font.",
  bold: "Large bold typography, high contrast, strong accent colors, impactful hero section. Make it punch.",
  warm: "Serif headings, earth tones (browns, ambers, creams), warm imagery, friendly and inviting feel.",
  elegant: "Refined serif fonts, subtle animations, muted palette with gold/bronze accents, generous padding, luxury feel.",
  playful: "Bright saturated colors, rounded shapes, fun typography, whimsical illustrations, energetic layout.",
  corporate: "Professional sans-serif, navy/gray palette, structured grid, clear hierarchy, trust signals.",
  dark: "Dark background (#0b0b0f or similar), light text, neon or metallic accents, dramatic hero, moody imagery.",
}

const SYSTEM_PROMPT = `You are an expert web designer. Generate a complete single-page website.

OUTPUT RULES (strict):
- Return ONLY a complete HTML document starting with <!DOCTYPE html>
- Put ALL CSS in a single <style> tag inside <head>
- Do NOT include any <script> tags or JavaScript
- Do NOT use external fonts, CDNs, or frameworks
- Use high-quality Unsplash images via https://images.unsplash.com URLs
- Make it fully responsive and beautiful on mobile
- Use modern CSS: gradients, grid, flexbox, clamp(), smooth transitions
- Keep the design premium and polished

CONTACT FORM (required):
Include a contact form section with these exact fields:
- <input name="name" type="text" required placeholder="Your Name">
- <input name="email" type="email" required placeholder="Your Email">
- <input name="phone" type="tel" placeholder="Phone Number">
- <textarea name="message" required placeholder="Your Message"></textarea>
- <button type="submit">Send Message</button>
Wrap in <form> (no action attribute).

EDITABLE MARKERS (critical):
On EVERY text element and image the user might edit, add:
- data-s9-edit="unique-key" (e.g. "hero-heading", "about-text", "service-1")
- data-s9-type="text" for text, data-s9-type="image" for <img>

Cover all headings, paragraphs, images, and feature/service cards.

SECTIONS TO INCLUDE:
- Hero with heading, tagline, and background image
- About section
- Services/features (3+ items)
- Gallery or portfolio (3 images)
- Contact section with form
- Footer

No explanation, no markdown fences. Output ONLY the HTML document.`

function buildPrompt(def: TemplateDef): string {
  const styleHint = STYLE_HINTS[def.style] ?? STYLE_HINTS.modern
  return `Create a ${def.name} website template for a ${def.industry} business.

Description: ${def.description}
Design style: ${def.style} — ${styleHint}
Industry: ${def.industry}
Category: ${def.category}

Make it look like a real, professional ${def.industry} website — not a generic template.
Use industry-appropriate Unsplash images and realistic placeholder text specific to ${def.industry}.`
}

async function generateWithDeepSeek(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          max_tokens: 16384,
          temperature: 0.8,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        if (res.status === 429 || res.status === 503) {
          const wait = Math.min(60, (attempt + 1) * 10)
          console.log(`  ⏳ Rate limited (${res.status}), waiting ${wait}s... (attempt ${attempt + 1}/${retries})`)
          await sleep(wait * 1000)
          continue
        }
        throw new Error(`DeepSeek HTTP ${res.status}: ${errBody.slice(0, 200)}`)
      }

      const data = await res.json()
      return data.choices?.[0]?.message?.content ?? ""
    } catch (err: unknown) {
      if (attempt < retries - 1) {
        const wait = (attempt + 1) * 10
        console.log(`  ⏳ Error, retrying in ${wait}s... (attempt ${attempt + 1}/${retries}): ${String(err).slice(0, 100)}`)
        await sleep(wait * 1000)
        continue
      }
      throw err
    }
  }
  throw new Error("All retry attempts exhausted")
}

function extractHtmlAndCss(raw: string): { html: string; css: string } {
  let cleaned = raw.trim()
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "")
  }

  const styleMatch = cleaned.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const css = styleMatch ? styleMatch[1].trim() : ""

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const html = bodyMatch
    ? bodyMatch[1].trim()
    : cleaned
        .replace(/<!DOCTYPE[^>]*>/i, "")
        .replace(/<html[^>]*>/i, "")
        .replace(/<\/html>/i, "")
        .replace(/<head[^>]*>[\s\S]*?<\/head>/i, "")
        .replace(/<body[^>]*>/i, "")
        .replace(/<\/body>/i, "")
        .trim()

  return { html, css }
}

function hasEditMarkers(html: string): boolean {
  return (html.match(/data-s9-edit="/g) || []).length >= 3
}

async function insertTemplate(def: TemplateDef, html: string, css: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/page_templates_gallery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: def.name,
      slug: def.slug,
      description: def.description,
      category: def.category,
      industry: def.industry,
      style: def.style,
      html,
      css,
      preview_url: def.preview_url,
      tags: def.tags,
      sort_order: 0,
      status: "approved",
      featured: false,
      created_by: "seed-script",
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`  ✗ Insert failed for ${def.slug}: ${err}`)
    return false
  }
  return true
}

function loadCheckpoint(): Set<string> {
  if (!existsSync(CHECKPOINT_FILE)) return new Set()
  try {
    const data = JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8"))
    return new Set(data.completed ?? [])
  } catch {
    return new Set()
  }
}

function saveCheckpoint(completed: Set<string>) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ completed: [...completed] }, null, 2))
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  if (!DEEPSEEK_KEY) { console.error("DEEPSEEK_API_KEY not set"); process.exit(1) }
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Supabase env vars not set"); process.exit(1) }

  const completed = loadCheckpoint()
  const remaining = TEMPLATE_DEFINITIONS.filter((d) => !completed.has(d.slug))

  console.log(`\n🚀 Seed Templates (DeepSeek) — ${TEMPLATE_DEFINITIONS.length} total, ${completed.size} done, ${remaining.length} remaining\n`)

  let success = 0
  let fail = 0

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE)
    console.log(`\n── Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.map((d) => d.slug).join(", ")}) ──`)

    const results = await Promise.allSettled(
      batch.map(async (def) => {
        console.log(`  → Generating: ${def.name}...`)
        try {
          const raw = await generateWithDeepSeek(buildPrompt(def))
          const { html, css } = extractHtmlAndCss(raw)

          if (!html || html.length < 100) {
            console.error(`  ✗ ${def.slug}: Generated HTML too short (${html.length} chars)`)
            return { def, ok: false }
          }

          if (!hasEditMarkers(html)) {
            console.warn(`  ⚠ ${def.slug}: Few/no edit markers — inserting anyway`)
          }

          const inserted = await insertTemplate(def, html, css)
          return { def, ok: inserted }
        } catch (err) {
          console.error(`  ✗ ${def.slug}: ${err}`)
          return { def, ok: false }
        }
      })
    )

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ok) {
        completed.add(r.value.def.slug)
        success++
        console.log(`  ✓ ${r.value.def.slug}`)
      } else {
        fail++
      }
    }

    saveCheckpoint(completed)

    if (i + BATCH_SIZE < remaining.length) {
      console.log(`  ⏳ Waiting 2s before next batch...`)
      await sleep(2000)
    }
  }

  console.log(`\n✅ Done! ${success} inserted, ${fail} failed, ${completed.size} total completed.\n`)
  if (fail > 0) {
    console.log(`Re-run the script to retry failed templates (checkpoint saved).\n`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
