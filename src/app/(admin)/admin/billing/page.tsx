import { getSession } from "@/lib/session"
import { getSubscriptionStatus } from "@/lib/subscription"
import { BillingClient } from "./billing-client"

export const metadata = {
  title: "Billing",
  description: "Manage your subscription and billing",
}

export default async function BillingPage() {
  const session = await getSession()

  let initialStatus = null

  // Fetch initial subscription status server-side if user is logged in
  if (session?.tenant_id && session.id !== "admin") {
    try {
      initialStatus = await getSubscriptionStatus(session.tenant_id)
    } catch {
      // Fall back to client-side fetch if server-side fails
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and view invoices</p>
      </div>
      <BillingClient initialStatus={initialStatus} />
    </div>
  )
}
