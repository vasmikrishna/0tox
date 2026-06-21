import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"

// PATCH — update a payment, e.g. mark it paid (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId, paymentId } = await params
  const supabase = createClient()
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.status === "paid") {
    update.status = "paid"
    update.paid_at = new Date().toISOString()
  } else if (typeof body.status === "string") {
    update.status = body.status
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("payments")
    .update(update)
    .eq("id", paymentId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action: body.status === "paid" ? "payment.marked_paid" : "payment.updated",
    entityType: "payment",
    entityId: paymentId,
    changes: { status: { old: null, new: update.status } },
  })

  return NextResponse.json({ payment: data })
}
