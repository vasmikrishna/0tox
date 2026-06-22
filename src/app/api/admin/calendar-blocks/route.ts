import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// GET — list calendar blocks for the current tenant (admin only).
export async function GET() {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ blocks: [] })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase
    .from("calendar_blocks")
    .select("*")
    .order("starts_at", { ascending: true })
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ blocks: data ?? [] })
}

// POST — block a time range (admin only).
export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const all_day = body.all_day === true
  let starts_at = typeof body.starts_at === "string" ? body.starts_at : ""
  let ends_at = typeof body.ends_at === "string" ? body.ends_at : ""

  if (!starts_at || !ends_at) return NextResponse.json({ error: "Start and end are required" }, { status: 400 })

  // All-day ranges come in as date-only strings; expand to cover the full day(s)
  // so overlap checks against bookings work correctly.
  if (all_day) {
    starts_at = `${starts_at.slice(0, 10)}T00:00:00`
    ends_at = `${ends_at.slice(0, 10)}T23:59:59`
  }

  if (new Date(ends_at) < new Date(starts_at)) {
    return NextResponse.json({ error: "End must be on or after start" }, { status: 400 })
  }

  const record = {
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Unavailable",
    starts_at,
    ends_at,
    all_day,
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ block: { id: `local-${Date.now()}`, tenant_id: null, ...record, created_at: new Date().toISOString() } })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  const { data, error } = await supabase
    .from("calendar_blocks")
    .insert({ ...record, tenant_id: tenant?.id ?? null } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ block: data })
}
