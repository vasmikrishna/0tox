import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { cancelRazorpaySubscription, isRazorpayConfigured } from "@/lib/razorpay"
import { getSubscriptionByTenant, upsertSubscription } from "@/lib/subscription"

/**
 * POST /api/billing/cancel
 * Cancel the tenant's subscription at the end of the current billing cycle.
 * When Razorpay is configured, cancels via Razorpay API (atCycleEnd=true).
 * When not configured, updates the subscription record with cancel_at_period_end flag.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const subscription = await getSubscriptionByTenant(owner.tenant.id)
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 })
  }

  // If Razorpay is configured and we have a subscription ID, cancel via Razorpay
  if (subscription.razorpay_subscription_id && isRazorpayConfigured()) {
    try {
      await cancelRazorpaySubscription(subscription.razorpay_subscription_id, true)
    } catch (error) {
      console.error("❌ Failed to cancel Razorpay subscription:", error)
      return NextResponse.json(
        { error: "Could not cancel subscription" },
        { status: 502 },
      )
    }
  }

  // Update the subscription record with cancellation flags
  await upsertSubscription(owner.tenant.id, {
    cancel_at_period_end: true,
    cancelled_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, cancelAtPeriodEnd: true })
}
