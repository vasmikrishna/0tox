import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOwnerContext } from "@/lib/build-owner"
import { renderBusinessTemplate, getBusinessTemplate } from "@/lib/business-templates"
import { splitAiHtml } from "@/lib/ai-website-prompt"
import { stripEditorMarkers } from "@/lib/curated-templates"
import { subdomainHost, type BusinessDetails } from "@/lib/onboarding"

/**
 * POST /api/build/publish
 * Turns the owner's choice into a published homepage and unlocks their portal.
 *
 * Body: { mode: "template" | "ai" | "curated", templateKey?, html?, css? }
 *  - template: render the chosen design from saved business details (legacy)
 *  - ai:       split the pasted/generated AI document into html + css (legacy)
 *  - curated:  publish the visually-edited curated template (new flow)
 *
 * Writes the tenant's single homepage custom_pages row (creating or updating
 * it) and flips tenants.onboarding_complete = true.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const mode = body.mode === "curated" ? "curated" : body.mode === "ai" ? "ai" : "template"

  const business = ((owner.tenant.settings as Record<string, unknown>)?.business ?? { name: owner.tenant.name }) as BusinessDetails
  if (!business.name) return NextResponse.json({ error: "Add your business details first" }, { status: 400 })

  let html = ""
  let css = ""
  let template = "blank"

  if (mode === "curated") {
    const raw = String(body.html ?? "")
    if (raw.trim().length < 40) {
      return NextResponse.json({ error: "No content to publish" }, { status: 400 })
    }
    html = stripEditorMarkers(raw)
    css = String(body.css ?? "")
    template = String(body.templateKey ?? "curated")
  } else if (mode === "template") {
    const key = String(body.templateKey ?? "")
    const tpl = getBusinessTemplate(key)
    const rendered = renderBusinessTemplate(tpl.key, business)
    html = rendered.html
    css = rendered.css
    template = tpl.key
  } else {
    const raw = String(body.html ?? "")
    if (raw.trim().length < 40) {
      return NextResponse.json({ error: "Paste the HTML your AI generated first" }, { status: 400 })
    }
    const split = splitAiHtml(raw)
    if (!split.html) return NextResponse.json({ error: "That doesn't look like valid HTML" }, { status: 400 })
    html = stripEditorMarkers(split.html)
    css = split.css
    template = "ai"
  }

  const supabase = createClient()

  // Find this tenant's existing homepage row (one homepage per tenant).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { data: existing } = await (supabase as any)
    .from("custom_pages")
    .select("id")
    .eq("tenant_id", owner.tenant.id)
    .eq("is_homepage", true)
    .maybeSingle()

  const row = {
    tenant_id: owner.tenant.id,
    slug: "home",
    title: business.name,
    html,
    css,
    template,
    status: "published",
    is_homepage: true,
  }

  const write = existing?.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
    ? await (supabase as any).from("custom_pages").update(row).eq("id", existing.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase as any).from("custom_pages").insert(row)

  if (write.error) {
    return NextResponse.json({ error: "Could not publish your website" }, { status: 500 })
  }

  // Unlock the portal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: tErr } = await (supabase as any)
    .from("tenants")
    .update({ onboarding_complete: true })
    .eq("id", owner.tenant.id)

  if (tErr) return NextResponse.json({ error: "Published, but could not unlock your portal" }, { status: 500 })

  return NextResponse.json({ ok: true, host: subdomainHost(owner.tenant.slug) })
}
