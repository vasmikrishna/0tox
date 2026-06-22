import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import type { BookingStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"]

// PATCH — update a booking's status or details (admin only).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}
  if (typeof body.status === "string" && STATUSES.includes(body.status as BookingStatus)) update.status = body.status
  if (typeof body.customer_name === "string" && body.customer_name.trim()) update.customer_name = body.customer_name.trim()
  if (typeof body.customer_email === "string") update.customer_email = body.customer_email.trim() || null
  if (typeof body.customer_phone === "string") update.customer_phone = body.customer_phone.trim() || null
  if (typeof body.service === "string") update.service = body.service.trim() || null
  if (typeof body.starts_at === "string") update.starts_at = body.starts_at
  if (typeof body.ends_at === "string") update.ends_at = body.ends_at
  if (typeof body.notes === "string") update.notes = body.notes.trim() || null

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ booking: { id, ...update } })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("bookings")
    .update(update as never)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ booking: data })
}

// DELETE — remove a booking (admin only).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient()
  const { error } = await supabase.from("bookings").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
