import { NextResponse } from "next/server"
import { z } from "zod"
import { getOwnerContext } from "@/lib/build-owner"
import { verifyCheckoutSignature } from "@/lib/razorpay"
import { upsertSubscription } from "@/lib/subscription"

const bodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

/**
 * POST /api/billing/verify
 * Called by the browser after Razorpay Checkout succeeds. Verifies the
 * signature and marks the subscription active. The webhook is the source of
 * truth for later lifecycle changes; this gives the user instant unlock.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Missing payment details" }, { status: 400 })

  if (!verifyCheckoutSignature(parsed.data)) {
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 })
  }

  await upsertSubscription(owner.tenant.id, {
    status: "active",
    razorpay_subscription_id: parsed.data.razorpay_subscription_id,
  })

  return NextResponse.json({ ok: true, active: true })
}
