import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/razorpay"
import { updateSubscriptionByRazorpayId } from "@/lib/subscription"

/**
 * POST /api/billing/webhook
 * Razorpay subscription lifecycle webhook — the source of truth for status.
 * Configure in the Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET and the
 * subscription.* events. Always returns 200 on a verified payload so Razorpay
 * stops retrying.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-razorpay-signature")

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: RazorpayWebhook
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const sub = event.payload?.subscription?.entity
  if (sub?.id) {
    const status = STATUS_BY_EVENT[event.event] ?? sub.status
    await updateSubscriptionByRazorpayId(sub.id, {
      status,
      current_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : undefined,
    })
  }

  return NextResponse.json({ received: true })
}

// Map Razorpay subscription events to the status we store. Falling back to the
// entity's own status keeps us correct if Razorpay adds events later.
const STATUS_BY_EVENT: Record<string, string> = {
  "subscription.authenticated": "authenticated",
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.pending": "pending",
  "subscription.halted": "halted",
  "subscription.cancelled": "cancelled",
  "subscription.completed": "completed",
  "subscription.paused": "paused",
  "subscription.resumed": "active",
}

interface RazorpayWebhook {
  event: string
  payload?: {
    subscription?: {
      entity?: { id?: string; status?: string; current_end?: number | null }
    }
  }
}
