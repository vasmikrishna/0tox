import { sendEmail } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export interface ReceiptEmailOptions {
  to: string
  name?: string
  amount: number // in paise
  currency: string
  planLabel?: string
  invoiceUrl?: string | null
}

export interface PaymentFailedEmailOptions {
  to: string
  name?: string
  planLabel?: string
}

/**
 * Send a receipt email for a successful payment / invoice.
 * Amount is in paise (e.g. 2900 = ₹29).
 */
export async function sendReceiptEmail(options: ReceiptEmailOptions): Promise<boolean> {
  const amountInRupees = (options.amount / 100).toFixed(2)
  const recipientName = options.name || "Customer"

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #1B3A6B; margin-top: 0;">Payment Received</h2>
      <p>Hi ${recipientName},</p>
      <p>Thank you for your payment. We've received your subscription payment:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16A34A;">
        <p style="margin: 0 0 8px 0;"><strong>${options.planLabel || "Subscription"}</strong></p>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">₹${amountInRupees} ${options.currency}</p>
      </div>
      ${options.invoiceUrl ? `<p><a href="${options.invoiceUrl}" style="display: inline-block; background: #1B3A6B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">View Invoice</a></p>` : ""}
      <p>Your subscription is now active and ready to use. Log in to your dashboard to get started:</p>
      <p><a href="${APP_URL}/build" style="display: inline-block; background: #1B3A6B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Go to Dashboard</a></p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— The 0toX Team</p>
    </div>
  `

  return sendEmail({
    to: options.to,
    subject: `Payment received: ${options.planLabel || "Subscription"}`,
    html,
  })
}

/**
 * Send a payment failed notification email.
 */
export async function sendPaymentFailedEmail(options: PaymentFailedEmailOptions): Promise<boolean> {
  const recipientName = options.name || "Customer"

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #DC2626; margin-top: 0;">Payment Failed</h2>
      <p>Hi ${recipientName},</p>
      <p>Unfortunately, we were unable to process your payment for your ${options.planLabel || "subscription"}.</p>
      <p style="background: #FEF2F2; padding: 12px; border-left: 4px solid #DC2626; border-radius: 4px;">
        Your subscription may be interrupted if the payment is not resolved.
      </p>
      <p>Please log in to your account to update your payment method:</p>
      <p><a href="${APP_URL}/build/settings" style="display: inline-block; background: #1B3A6B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Update Payment Method</a></p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— The 0toX Team</p>
    </div>
  `

  return sendEmail({
    to: options.to,
    subject: `Payment failed: ${options.planLabel || "subscription"} billing issue`,
    html,
  })
}
