import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getCurrentTenant } from "@/lib/tenant"
import { getSession } from "@/lib/session"
import type { Product } from "@/types"

interface CheckoutBody {
  items?: { product_id: string; quantity: number }[]
  customer_email?: string
  customer_name?: string
}

/**
 * Create a store order and start checkout.
 * Prices and stock are re-read from the DB — the client cart is never trusted.
 * Sets metadata.order_id so the Stripe webhook can mark the order paid and
 * decrement stock. Without Stripe configured, the order is completed inline so
 * the flow stays demoable in local dev.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as CheckoutBody
  const reqItems = (body.items ?? []).filter(i => i?.product_id && i.quantity > 0)
  if (!reqItems.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 })

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)
  const session = await getSession().catch(() => null)

  const ids = reqItems.map(i => i.product_id)
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("status", "active")
  const productList = (products ?? []) as Product[]
  if (!productList.length) return NextResponse.json({ error: "No valid products" }, { status: 400 })

  const lines = reqItems
    .map(reqItem => {
      const p = productList.find(pr => pr.id === reqItem.product_id)
      if (!p) return null
      const unit = p.sale_price ?? p.price
      const qty = p.manage_stock ? Math.min(reqItem.quantity, p.stock_quantity) : reqItem.quantity
      if (qty <= 0) return null
      return { product: p, unit_price: Number(unit), quantity: qty }
    })
    .filter(Boolean) as { product: Product; unit_price: number; quantity: number }[]

  if (!lines.length) return NextResponse.json({ error: "Items are out of stock" }, { status: 409 })

  const total = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0)
  const customerEmail = body.customer_email ?? session?.email ?? "guest@example.com"

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant?.id ?? null,
      customer_id: session?.id ?? null,
      customer_name: body.customer_name ?? session?.name ?? null,
      customer_email: customerEmail,
      total,
      currency: "usd",
      status: "pending",
    })
    .select()
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message ?? "Could not create order" }, { status: 500 })
  }
  const orderId = (order as { id: string }).id

  await supabase.from("order_items").insert(
    lines.map(l => ({
      order_id: orderId,
      product_id: l.product.id,
      name: l.product.name,
      price: l.unit_price,
      quantity: l.quantity,
    })),
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin

  // Dev / no-Stripe fallback: complete immediately so the flow is demoable.
  if (!isStripeConfigured()) {
    await supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", orderId)
    for (const l of lines) {
      await supabase.rpc("decrement_product_stock", { p_product_id: l.product.id, p_qty: l.quantity })
    }
    return NextResponse.json({ url: `${appUrl}/shop?order=success`, orderId, dev: true })
  }

  const checkout = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: lines.map(l => ({
      price_data: {
        currency: "usd",
        product_data: { name: l.product.name },
        unit_amount: Math.round(l.unit_price * 100),
      },
      quantity: l.quantity,
    })),
    metadata: { order_id: orderId },
    success_url: `${appUrl}/shop?order=success`,
    cancel_url: `${appUrl}/shop/cart`,
  })

  await supabase.from("orders").update({ stripe_session_id: checkout.id }).eq("id", orderId)
  return NextResponse.json({ url: checkout.url, orderId })
}
