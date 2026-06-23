import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("tenants")
    .select("slug, custom_domain, domain_verified")
    .eq("id", session.tenant_id)
    .maybeSingle()

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

  return NextResponse.json({
    slug: data?.slug ?? "",
    subdomain: data?.slug ? `${data.slug}.${baseDomain}` : "",
    custom_domain: data?.custom_domain ?? null,
    domain_verified: data?.domain_verified ?? false,
    baseDomain,
  })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? "")

  const supabase = createClient()

  if (action === "set") {
    let domain = String(body.domain ?? "").trim().toLowerCase()
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Strip protocol and trailing slash
    domain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "")

    // Basic validation
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"
    if (domain.endsWith(`.${baseDomain}`) || domain === baseDomain) {
      return NextResponse.json({ error: "Cannot use a site9.in subdomain as custom domain" }, { status: 400 })
    }

    // Check if domain is already taken by another tenant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("tenants")
      .select("id")
      .eq("custom_domain", domain)
      .neq("id", session.tenant_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "This domain is already connected to another site" }, { status: 409 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("tenants")
      .update({ custom_domain: domain, domain_verified: false })
      .eq("id", session.tenant_id)

    if (error) {
      return NextResponse.json({ error: "Failed to save domain" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, domain })
  }

  if (action === "verify") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant } = await (supabase as any)
      .from("tenants")
      .select("custom_domain, slug")
      .eq("id", session.tenant_id)
      .maybeSingle()

    if (!tenant?.custom_domain) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    // Verify DNS by checking if the domain resolves (CNAME to site9.in)
    const verified = await checkDns(tenant.custom_domain)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("tenants")
      .update({ domain_verified: verified })
      .eq("id", session.tenant_id)

    return NextResponse.json({ verified, domain: tenant.custom_domain })
  }

  if (action === "remove") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("tenants")
      .update({ custom_domain: null, domain_verified: false })
      .eq("id", session.tenant_id)

    if (error) {
      return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

async function checkDns(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`, {
      headers: { Accept: "application/dns-json" },
    })
    if (!res.ok) return false
    const data = await res.json()
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"
    // Check if any CNAME answer points to our domain
    const answers = data.Answer ?? []
    return answers.some((a: { data?: string }) =>
      a.data?.replace(/\.$/, "").endsWith(baseDomain)
    )
  } catch {
    return false
  }
}
