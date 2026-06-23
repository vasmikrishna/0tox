/**
 * Screenshot script — captures a preview image for each template using Playwright.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx playwright test --config=/dev/null -e 'true' 2>/dev/null; pnpm exec tsx src/scripts/screenshot-templates.ts
 *
 * Or simply:
 *   set -a && source .env.local && set +a && pnpm exec tsx src/scripts/screenshot-templates.ts
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Requires: npx playwright (globally installed)
 */

import { execSync } from "child_process"
import { writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OUT_DIR = resolve(__dirname, "../../public/template-previews")
const VIEWPORT = { width: 1280, height: 800 }

interface Template {
  id: string
  slug: string
  name: string
  html: string
  css: string
  preview_url: string | null
}

async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/page_templates_gallery?status=eq.approved&select=id,slug,name,html,css,preview_url&order=slug.asc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  )
  if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`)
  return res.json()
}

async function updatePreviewUrl(id: string, url: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/page_templates_gallery?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ preview_url: url }),
  })
  if (!res.ok) console.error(`  Failed to update preview_url for ${id}`)
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase env vars not set")
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })

  console.log("\n📸 Screenshot Templates\n")
  console.log("Fetching templates...")
  const templates = await fetchTemplates()
  console.log(`Found ${templates.length} approved templates\n`)

  let success = 0
  let fail = 0

  for (const tpl of templates) {
    const outPath = resolve(OUT_DIR, `${tpl.slug}.png`)
    const publicUrl = `/template-previews/${tpl.slug}.png`

    console.log(`  → ${tpl.name} (${tpl.slug})...`)

    try {
      const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${VIEWPORT.width},initial-scale=1"><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;}${tpl.css}</style></head><body>${tpl.html}</body></html>`

      const tmpHtmlPath = resolve(OUT_DIR, `_tmp_${tpl.slug}.html`)
      writeFileSync(tmpHtmlPath, fullHtml)

      const cmd = `npx playwright screenshot --viewport-size="${VIEWPORT.width},${VIEWPORT.height}" --full-page "file://${tmpHtmlPath}" "${outPath}" 2>&1`
      execSync(cmd, { timeout: 30000 })

      // Clean up temp file
      try { execSync(`rm "${tmpHtmlPath}"`) } catch {}

      await updatePreviewUrl(tpl.id, publicUrl)
      success++
      console.log(`    ✓ saved`)
    } catch (err) {
      fail++
      console.error(`    ✗ ${String(err).slice(0, 100)}`)
    }
  }

  console.log(`\n✅ Done! ${success} screenshots, ${fail} failed.\n`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
