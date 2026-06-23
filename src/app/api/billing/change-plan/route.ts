import { NextResponse } from "next/server"
import { z } from "zod"
import { getOwnerContext } from "@/lib/build-owner"
import {
  cancelRazorpaySubscription,
  getPlan,
  getRazorpay,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay"
import { getSubscriptionByTenant, upsertSubscription } from "@/lib/subscription"

const bodySchema = z.object({ plan: z.enum(["monthly", "annual"]) })

/**
 * POST /api/billing/change-plan
 * Change the tenant's subscription plan. Cancels the old subscription and creates
 * a new one. When Razorpay is configured, uses the Razorpay API. When not configured,
 * unlocks the new plan inline (dev fallback).
 *
 * Body: { plan: "monthly" | "annual" }
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid plan" }, { status: 400 })

  const newPlan = getPlan(parsed.data.plan)!
  const currentSubscription = await getSubscriptionByTenant(owner.tenant.id)

  // Cancel the old subscription if it exists and has a Razorpay ID
  if (currentSubscription?.razorpay_subscription_id && isRazorpayConfigured()) {
    try {
      await cancelRazorpaySubscription(currentSubscription.razorpay_subscription_id, false)
    } catch (error) {
      console.error("❌ Failed to cancel old Razorpay subscription:", error)
      // Continue — we'll create the new one anyway
    }
  }

  // ── Dev fallback: no Razorpay keys → unlock inline ──────────────────────────
  if (!isRazorpayConfigured()) {
    const end = new Date()
    end.setMonth(end.getMonth() + (newPlan.key === "annual" ? 12 : 1))
    await upsertSubscription(owner.tenant.id, {
      plan: newPlan.key,
      status: "active",
      current_end: end.toISOString(),
      razorpay_subscription_id: null,
      razorpay_plan_id: null,
      cancel_at_period_end: false,
      cancelled_at: null,
    })
    return NextResponse.json({ dev: true, active: true })
  }

  if (!newPlan.planId) {
    return NextResponse.json(
      { error: "This plan is not set up yet. Run the Razorpay plan setup script." },
      { status: 500 },
    )
  }

  // Create a new Razorpay subscription
  let subscription
  try {
    subscription = await getRazorpay().subscriptions.create({
      plan_id: newPlan.planId,
      total_count: newPlan.totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: { tenant_id: owner.tenant.id, tenant_slug: owner.tenant.slug },
    })
  } catch {
    return NextResponse.json({ error: "Could not start the subscription" }, { status: 502 })
  }

  // Update the subscription record with the new Razorpay subscription
  await upsertSubscription(owner.tenant.id, {
    plan: newPlan.key,
    status: subscription.status ?? "created",
    razorpay_subscription_id: subscription.id,
    razorpay_plan_id: newPlan.planId,
    razorpay_customer_id:
      typeof subscription.customer_id === "string" ? subscription.customer_id : null,
    short_url: subscription.short_url ?? null,
    cancel_at_period_end: false,
    cancelled_at: null,
  })

  return NextResponse.json({
    dev: false,
    subscriptionId: subscription.id,
    keyId: getRazorpayKeyId(),
    plan: newPlan.key,
    planLabel: newPlan.label,
    priceLabel: newPlan.priceLabel,
    name: owner.tenant.name,
    email: owner.session.email,
  })
}
