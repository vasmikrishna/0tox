"use client"

// Minimal shape of the Razorpay Checkout widget we use.
interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  handler: (resp: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): { open: () => void }
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

function loadRazorpay(): Promise<RazorpayConstructor | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null)
    if (window.Razorpay) return resolve(window.Razorpay)
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay ?? null))
      existing.addEventListener("error", () => resolve(null))
      return
    }
    const script = document.createElement("script")
    script.src = CHECKOUT_SRC
    script.onload = () => resolve(window.Razorpay ?? null)
    script.onerror = () => resolve(null)
    document.body.appendChild(script)
  })
}

export interface CheckoutParams {
  subscriptionId: string
  keyId: string
  name?: string
  email?: string
  description?: string
  onSuccess: () => void
  onError: (msg: string) => void
}

export function useRazorpayCheckout() {
  return async function startCheckout(params: CheckoutParams) {
    try {
      const Razorpay = await loadRazorpay()
      if (!Razorpay) {
        params.onError("Could not load the payment window. Check your connection.")
        return
      }

      const checkout = new Razorpay({
        key: params.keyId,
        subscription_id: params.subscriptionId,
        name: params.name ?? "0tox",
        description: params.description ?? "0tox subscription",
        prefill: params.email ? { email: params.email } : undefined,
        theme: { color: "#6d28d9" },
        handler: async (resp) => {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          })
          if (verify.ok) {
            params.onSuccess()
          } else {
            params.onError("Payment captured but could not be verified. Refresh in a moment.")
          }
        },
        modal: {
          ondismiss: () => {
            params.onError("Payment cancelled")
          },
        },
      })
      checkout.open()
    } catch {
      params.onError("Something went wrong. Please try again.")
    }
  }
}
