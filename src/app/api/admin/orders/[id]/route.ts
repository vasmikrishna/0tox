import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import type { OrderStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"]

// PATCH — update order status (admin only). Does not touch stock (webhook owns stock).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  if (typeof body.status !== "string" || !STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const update: Record<string, unknown> = { status: body.status }
  if (body.status === "paid") update.paid_at = new Date().toISOString()

  if (!supabaseConfigured()) {
    return NextResponse.json({ order: { id, ...update } })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("orders")
    .update(update as never)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ order: data })
}
