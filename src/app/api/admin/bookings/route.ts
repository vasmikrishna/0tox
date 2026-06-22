import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import type { BookingStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"]

// GET — list bookings for the current tenant (admin only), with status counts for tabs.
export async function GET(req: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ bookings: [], counts: { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 } })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase
    .from("bookings")
    .select("*")
    .order("starts_at", { ascending: false })
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)
  if (status && STATUSES.includes(status as BookingStatus)) query = query.eq("status", status as BookingStatus)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Counts by status (for the tab badges)
  let countQuery = supabase.from("bookings").select("status")
  if (tenant?.id) countQuery = countQuery.eq("tenant_id", tenant.id)
  const { data: countRows } = await countQuery

  const counts = { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
  for (const row of (countRows ?? []) as { status: string }[]) {
    counts.all++
    if (row.status in counts) counts[row.status as keyof typeof counts]++
  }

  return NextResponse.json({ bookings: data ?? [], counts })
}

// POST — create a booking (admin only).
export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const customer_name = typeof body.customer_name === "string" ? body.customer_name.trim() : ""
  const starts_at = typeof body.starts_at === "string" ? body.starts_at : ""
  const ends_at = typeof body.ends_at === "string" ? body.ends_at : ""

  if (!customer_name) return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
  if (!starts_at || !ends_at) return NextResponse.json({ error: "Start and end times are required" }, { status: 400 })
  if (new Date(ends_at) <= new Date(starts_at)) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
  }

  const record = {
    customer_name,
    customer_email: typeof body.customer_email === "string" && body.customer_email.trim() ? body.customer_email.trim() : null,
    customer_phone: typeof body.customer_phone === "string" && body.customer_phone.trim() ? body.customer_phone.trim() : null,
    service: typeof body.service === "string" && body.service.trim() ? body.service.trim() : null,
    starts_at,
    ends_at,
    status: (STATUSES.includes(body.status) ? body.status : "pending") as BookingStatus,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
  }

  if (!supabaseConfigured()) {
    const now = new Date().toISOString()
    return NextResponse.json({ booking: { id: `local-${Date.now()}`, tenant_id: null, ...record, created_at: now, updated_at: now } })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...record, tenant_id: tenant?.id ?? null } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ booking: data })
}
