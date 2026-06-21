import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { slugify, validateSlug, subdomainHost } from "@/lib/onboarding"

/**
 * GET /api/onboarding/check-subdomain?slug=mybiz
 * Returns whether a subdomain is free to claim. Combines format/reserved-word
 * validation with a uniqueness check against the tenants table.
 */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("slug") ?? ""
  const slug = slugify(raw)

  const format = validateSlug(slug)
  if (!format.valid) {
    return NextResponse.json({ slug, available: false, reason: format.reason })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Could not check availability" }, { status: 500 })
  }

  const available = !data
  return NextResponse.json({
    slug,
    available,
    host: subdomainHost(slug),
    reason: available ? undefined : "This subdomain is already taken",
  })
}
