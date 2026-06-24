import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import { getBookingConfig } from "@/lib/booking-config"
import { getSession } from "@/lib/session"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// GET — public: booking config + upcoming blocked ranges.
export async function GET() {
  const tenant = await getCurrentTenant().catch(() => null)
  const config = getBookingConfig(tenant?.settings)

  if (!supabaseConfigured()) {
    return NextResponse.json({ config, blocks: [] })
  }

  const supabase = createClient()
  const nowIso = new Date().toISOString()

  const blocksQ = supabase
    .from("calendar_blocks")
    .select("starts_at, ends_at, all_day, title")
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: true })
  if (tenant?.id) blocksQ.eq("tenant_id", tenant.id)

  const { data: blocks } = await blocksQ

  return NextResponse.json({ config, blocks: blocks ?? [] })
}

// POST — public: a customer requests an appointment. Rejected (409) if the
// requested window overlaps a calendar block or an existing live booking.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const customer_name = typeof body.customer_name === "string" ? body.customer_name.trim() : ""
  const customer_email = typeof body.customer_email === "string" ? body.customer_email.trim() : ""
  const starts_at = typeof body.starts_at === "string" ? body.starts_at : ""
  const ends_at = typeof body.ends_at === "string" ? body.ends_at : ""

  if (!customer_name) return NextResponse.json({ error: "Please enter your name" }, { status: 400 })
  if (!customer_email) return NextResponse.json({ error: "Please enter your email" }, { status: 400 })
  if (!starts_at || !ends_at) return NextResponse.json({ error: "Please pick a time" }, { status: 400 })

  const startMs = new Date(starts_at).getTime()
  const endMs = new Date(ends_at).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 })
  }
  if (endMs <= startMs) return NextResponse.json({ error: "End time must be after the start time" }, { status: 400 })
  if (startMs < Date.now()) return NextResponse.json({ error: "Please pick a time in the future" }, { status: 400 })

  const record = {
    customer_name,
    customer_email,
    customer_phone: typeof body.customer_phone === "string" && body.customer_phone.trim() ? body.customer_phone.trim() : null,
    service: typeof body.service === "string" && body.service.trim() ? body.service.trim() : null,
    starts_at,
    ends_at,
    status: "pending" as const,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ booking: { id: `local-${Date.now()}`, ...record } })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  // Two intervals overlap iff existing.starts_at < requested.ends_at AND existing.ends_at > requested.starts_at.
  const blockQ = supabase
    .from("calendar_blocks")
    .select("id")
    .lt("starts_at", ends_at)
    .gt("ends_at", starts_at)
    .limit(1)
  if (tenant?.id) blockQ.eq("tenant_id", tenant.id)
  const { data: blockHit } = await blockQ
  if (blockHit && blockHit.length > 0) {
    return NextResponse.json({ error: "That time isn't available — please choose another slot." }, { status: 409 })
  }

  const busyQ = supabase
    .from("bookings")
    .select("id")
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", ends_at)
    .gt("ends_at", starts_at)
    .limit(1)
  if (tenant?.id) busyQ.eq("tenant_id", tenant.id)
  const { data: busyHit } = await busyQ
  if (busyHit && busyHit.length > 0) {
    return NextResponse.json({ error: "That slot was just taken — please choose another time." }, { status: 409 })
  }

  // Link the booking to the logged-in customer — but only when their session is
  // actually for THIS tenant, so customer_id always points at the right per-tenant
  // user row (a visitor could be signed into a different business's session).
  const session = await getSession()
  const customer_id = session?.id && tenant?.id && session.tenant_id === tenant.id ? session.id : null

  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...record, tenant_id: tenant?.id ?? null, customer_id } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Could not submit your booking. Please try again." }, { status: 500 })

  return NextResponse.json({ booking: data })
}
