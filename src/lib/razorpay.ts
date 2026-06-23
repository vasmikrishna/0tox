import crypto from "crypto"
import Razorpay from "razorpay"

/**
 * Razorpay client + plan catalogue for subscription billing.
 *
 * When the keys are absent (local dev), `isRazorpayConfigured()` returns false
 * and callers fall back to unlocking the subscription inline so the flow stays
 * demoable without hitting Razorpay.
 */

export type PlanKey = "monthly" | "annual"

export interface PlanConfig {
  key: PlanKey
  /** Razorpay plan id (from env, created via scripts/razorpay-setup.ts). */
  planId: string | undefined
  /** Price in paise (₹1 = 100 paise). */
  amount: number
  period: "monthly" | "yearly"
  interval: number
  /** Number of billing cycles to schedule the subscription for. */
  totalCount: number
  label: string
  /** Human-readable price, e.g. "₹29/month". */
  priceLabel: string
  /** Short selling point shown on the plan card. */
  blurb: string
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  monthly: {
    key: "monthly",
    planId: process.env.RAZORPAY_PLAN_MONTHLY_ID,
    amount: 2900, // ₹29
    period: "monthly",
    interval: 1,
    totalCount: 120, // ~10 years of monthly cycles
    label: "Monthly",
    priceLabel: "₹29/month",
    blurb: "Billed every month. Cancel anytime.",
  },
  annual: {
    key: "annual",
    planId: process.env.RAZORPAY_PLAN_ANNUAL_ID,
    amount: 10800, // ₹108
    period: "yearly",
    interval: 1,
    totalCount: 10, // 10 yearly cycles
    label: "Annual",
    priceLabel: "₹108/year",
    blurb: "Just ₹9/month — save 69% vs monthly.",
  },
}

export function getPlan(key: string): PlanConfig | null {
  return key === "monthly" || key === "annual" ? PLANS[key] : null
}

export function isRazorpayConfigured(): boolean {
  return !!process.env.RAZORPAY_KEY_ID?.trim() && !!process.env.RAZORPAY_KEY_SECRET?.trim()
}

let client: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID?.trim()
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!key_id || !key_secret) throw new Error("Razorpay is not configured")
    client = new Razorpay({ key_id, key_secret })
  }
  return client
}

/** Public key id for the browser Checkout widget. */
export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID?.trim() ?? ""
}

/**
 * Cancel a Razorpay subscription. `atCycleEnd=true` keeps it active until the
 * end of the current paid period; `false` cancels immediately.
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  atCycleEnd = true,
) {
  // razorpay typings accept a boolean "cancel at cycle end" flag.
  return getRazorpay().subscriptions.cancel(subscriptionId, atCycleEnd)
}

/** Fetch the live state of a Razorpay subscription. */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  return getRazorpay().subscriptions.fetch(subscriptionId)
}

/**
 * Verify the signature returned by Razorpay Checkout after a subscription
 * authorisation: HMAC_SHA256(payment_id + "|" + subscription_id, key_secret).
 */
export function verifyCheckoutSignature(args: {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim()
  if (!secret) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${args.razorpay_payment_id}|${args.razorpay_subscription_id}`)
    .digest("hex")
  return timingSafeEqual(expected, args.razorpay_signature)
}

/** Verify a Razorpay webhook payload against the configured webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
  if (!secret || !signature) return false
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return timingSafeEqual(expected, signature)
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
