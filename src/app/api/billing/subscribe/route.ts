import { NextResponse } from "next/server"
import { z } from "zod"
import { getOwnerContext } from "@/lib/build-owner"
import { getPlan, getRazorpay, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/razorpay"
import { upsertSubscription } from "@/lib/subscription"

const bodySchema = z.object({ plan: z.enum(["monthly", "annual"]) })

/**
 * POST /api/billing/subscribe
 * Starts a Razorpay subscription for the signed-in tenant and returns the
 * params the browser Checkout widget needs. When Razorpay is not configured,
 * unlocks the subscription inline (dev fallback) so the flow stays demoable.
 *
 * Body: { plan: "monthly" | "annual" }
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid plan" }, { status: 400 })

  const plan = getPlan(parsed.data.plan)!

  // ── Dev fallback: no Razorpay keys → unlock inline ──────────────────────────
  if (!isRazorpayConfigured()) {
    const end = new Date()
    end.setMonth(end.getMonth() + (plan.key === "annual" ? 12 : 1))
    await upsertSubscription(owner.tenant.id, {
      plan: plan.key,
      status: "active",
      current_end: end.toISOString(),
      razorpay_subscription_id: null,
      razorpay_plan_id: null,
    })
    return NextResponse.json({ dev: true, active: true })
  }

  if (!plan.planId) {
    return NextResponse.json(
      { error: "This plan is not set up yet. Run the Razorpay plan setup script." },
      { status: 500 },
    )
  }

  let subscription
  try {
    subscription = await getRazorpay().subscriptions.create({
      plan_id: plan.planId,
      total_count: plan.totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: { tenant_id: owner.tenant.id, tenant_slug: owner.tenant.slug },
    })
  } catch {
    return NextResponse.json({ error: "Could not start the subscription" }, { status: 502 })
  }

  await upsertSubscription(owner.tenant.id, {
    plan: plan.key,
    status: subscription.status ?? "created",
    razorpay_subscription_id: subscription.id,
    razorpay_plan_id: plan.planId,
    razorpay_customer_id:
      typeof subscription.customer_id === "string" ? subscription.customer_id : null,
    short_url: subscription.short_url ?? null,
  })

  return NextResponse.json({
    dev: false,
    subscriptionId: subscription.id,
    keyId: getRazorpayKeyId(),
    plan: plan.key,
    planLabel: plan.label,
    priceLabel: plan.priceLabel,
    name: owner.tenant.name,
    email: owner.session.email,
  })
}
