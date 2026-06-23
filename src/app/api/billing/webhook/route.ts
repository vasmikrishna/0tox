import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/razorpay"
import {
  getTenantIdByRazorpaySubscription,
  recordInvoice,
  updateSubscriptionByRazorpayId,
} from "@/lib/subscription"
import { sendReceiptEmail, sendPaymentFailedEmail } from "@/lib/email/billing"

/**
 * POST /api/billing/webhook
 * Razorpay subscription lifecycle webhook — the source of truth for status.
 * Configure in the Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET and the
 * subscription.* events. Always returns 200 on a verified payload so Razorpay
 * stops retrying.
 *
 * Handles:
 * - subscription.* events for subscription status updates
 * - subscription.charged / invoice.paid for recording invoices and sending receipts
 * - subscription.halted and payment failures for sending payment failure emails
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

  // Update subscription status based on subscription.* events
  const sub = event.payload?.subscription?.entity
  if (sub?.id) {
    const status = STATUS_BY_EVENT[event.event] ?? sub.status
    await updateSubscriptionByRazorpayId(sub.id, {
      status,
      current_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : undefined,
    })
  }

  // Handle subscription.charged and invoice.paid events
  if (event.event === "subscription.charged" || event.event === "invoice.paid") {
    const subId = event.payload?.subscription?.entity?.id
    const payment = event.payload?.payment?.entity
    const invoice = event.payload?.invoice?.entity

    if (subId && (payment || invoice)) {
      try {
        const tenantInfo = await getTenantIdByRazorpaySubscription(subId)
        if (tenantInfo) {
          const razorpayInvoiceId = invoice?.id
          const razorpayPaymentId = payment?.id
          const amount = payment?.amount ?? invoice?.amount
          const invoiceUrl = invoice?.short_url ?? invoice?.url

          const isNew = await recordInvoice(tenantInfo.tenant_id, {
            subscription_id: tenantInfo.id,
            razorpay_invoice_id: razorpayInvoiceId,
            razorpay_payment_id: razorpayPaymentId,
            amount,
            currency: "INR",
            status: "paid",
            invoice_url: invoiceUrl ?? null,
            paid_at: new Date().toISOString(),
          })

          // Send receipt email only if this is a newly recorded invoice
          if (isNew) {
            try {
              const supabase = await import("@/lib/supabase/server").then((m) => m.createClient())
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
              const { data: tenant } = await (supabase as any)
                .from("tenants")
                .select("id, contact_email, name")
                .eq("id", tenantInfo.tenant_id)
                .maybeSingle()

              if (tenant?.contact_email) {
                await sendReceiptEmail({
                  to: tenant.contact_email,
                  name: tenant.name,
                  amount: amount || 0,
                  currency: "INR",
                  invoiceUrl: invoiceUrl ?? null,
                })
              }
            } catch (error) {
              console.error("❌ Failed to send receipt email:", error)
              // Continue — email is best-effort
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to record invoice:", error)
        // Continue — always return 200 to prevent Razorpay retries
      }
    }
  }

  // Handle payment failure events
  if (
    event.event === "subscription.halted" ||
    event.event === "invoice.failed" ||
    event.event === "payment.failed"
  ) {
    const subId = event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.subscription_id

    if (subId) {
      try {
        const tenantInfo = await getTenantIdByRazorpaySubscription(subId)
        if (tenantInfo) {
          try {
            const supabase = await import("@/lib/supabase/server").then((m) => m.createClient())
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
            const { data: tenant } = await (supabase as any)
              .from("tenants")
              .select("id, contact_email, name")
              .eq("id", tenantInfo.tenant_id)
              .maybeSingle()

            if (tenant?.contact_email) {
              await sendPaymentFailedEmail({
                to: tenant.contact_email,
                name: tenant.name,
              })
            }
          } catch (error) {
            console.error("❌ Failed to send payment failed email:", error)
            // Continue — email is best-effort
          }
        }
      } catch (error) {
        console.error("❌ Failed to lookup tenant for payment failure:", error)
        // Continue — always return 200
      }
    }
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
      entity?: {
        id?: string
        status?: string
        current_end?: number | null
      }
    }
    payment?: {
      entity?: {
        id?: string
        amount?: number
        subscription_id?: string
      }
    }
    invoice?: {
      entity?: {
        id?: string
        amount?: number
        url?: string
        short_url?: string
      }
    }
  }
}
