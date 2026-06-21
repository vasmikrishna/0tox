import Stripe from "stripe"

let client: Stripe | null = null

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY?.trim()
}

export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY?.trim()
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured")
    }
    client = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    })
  }
  return client
}
