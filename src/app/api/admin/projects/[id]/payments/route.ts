import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"
import type { PaymentMethod } from "@/types"

const METHODS: PaymentMethod[] = ["stripe", "bank_transfer", "other"]

// POST — create a payment line for a project (admin only)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: projectId } = await params
  const supabase = createClient()
  const body = await request.json()

  const label = typeof body.label === "string" ? body.label.trim() : ""
  const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount)
  if (!label || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "label and amount are required" }, { status: 400 })
  }
  const method: PaymentMethod = METHODS.includes(body.method) ? body.method : "stripe"

  const { data, error } = await supabase
    .from("payments")
    .insert({
      project_id: projectId,
      label,
      amount,
      method,
      due_date: body.due_date || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logChange({
    projectId,
    userId: session.id,
    userEmail: session.email,
    action: "payment.created",
    entityType: "payment",
    entityId: data.id,
    changes: { label: { old: null, new: label }, amount: { old: null, new: amount } },
  })

  return NextResponse.json({ payment: data })
}
