import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Project payment (existing flow) ──────────────────────────────────────
    const paymentId = session.metadata?.payment_id
    if (paymentId) {
      await supabase.from("payments").update({
        status: "paid",
        method: "stripe",
        stripe_payment_intent_id: session.payment_intent,
        paid_at: new Date().toISOString(),
      }).eq("id", paymentId)
    }

    // ── Store order (e-commerce flow) ────────────────────────────────────────
    const orderId = session.metadata?.order_id
    if (orderId) {
      await markOrderPaid(supabase, orderId, session.payment_intent as string | undefined)
    }
  }

  return NextResponse.json({ received: true })
}

/**
 * Mark a store order as paid and decrement stock for each line item.
 * Idempotent: skips stock changes if the order is already paid.
 */
export async function markOrderPaid(
  supabase: SupabaseClient<Database>,
  orderId: string,
  paymentIntentId?: string,
) {
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single()

  if (!order || (order as { status?: string }).status === "paid") return

  await supabase.from("orders").update({
    status: "paid",
    stripe_payment_intent_id: paymentIntentId ?? null,
    paid_at: new Date().toISOString(),
  }).eq("id", orderId)

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId)

  for (const item of (items ?? []) as { product_id: string | null; quantity: number }[]) {
    if (!item.product_id) continue
    await supabase.rpc("decrement_product_stock", {
      p_product_id: item.product_id,
      p_qty: item.quantity,
    })
  }
}
