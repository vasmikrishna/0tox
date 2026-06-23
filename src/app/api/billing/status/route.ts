import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { getSubscriptionStatus } from "@/lib/subscription"

/**
 * GET /api/billing/status
 * Current tenant's subscription state. The builder polls this after checkout
 * to hide the upsell once the subscription is active.
 */
export async function GET() {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const status = await getSubscriptionStatus(owner.tenant.id)
  return NextResponse.json(status)
}
