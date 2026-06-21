import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOwnerContext } from "@/lib/build-owner"
import type { BusinessDetails } from "@/lib/onboarding"

/**
 * POST /api/build/save
 * Persists the business details the owner entered in the builder into
 * tenants.settings.business (merged with whatever is already there).
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const incoming = (body.details ?? {}) as Partial<BusinessDetails>

  const name = String(incoming.name ?? owner.tenant.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "Business name is required" }, { status: 400 })

  const details: BusinessDetails = {
    name,
    tagline: str(incoming.tagline),
    about: str(incoming.about),
    category: str(incoming.category),
    address: str(incoming.address),
    phone: str(incoming.phone),
    whatsapp: str(incoming.whatsapp),
    email: str(incoming.email),
    hours: str(incoming.hours),
    services: Array.isArray(incoming.services)
      ? incoming.services.map(s => String(s).trim()).filter(Boolean).slice(0, 12)
      : undefined,
  }

  const supabase = createClient()
  const settings = { ...(owner.tenant.settings ?? {}), business: details }
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ settings })
    .eq("id", owner.tenant.id)

  if (error) return NextResponse.json({ error: "Could not save details" }, { status: 500 })
  return NextResponse.json({ ok: true, details })
}

function str(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : ""
  return s || undefined
}
