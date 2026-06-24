"use client"

import { useState } from "react"
import { Sparkles, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type PlanKey = "monthly" | "annual"

interface PlanCard {
  key: PlanKey
  label: string
  price: string
  per: string
  blurb: string
  highlight?: boolean
}

const PLAN_CARDS: PlanCard[] = [
  { key: "monthly", label: "Monthly", price: "₹29", per: "/month", blurb: "Billed monthly. Cancel anytime." },
  { key: "annual", label: "Annual", price: "₹108", per: "/year", blurb: "Just ₹9/month — save 69%.", highlight: true },
]

const PERKS = [
  "Remove the 0tox badge from your site",
  "Custom domain & priority publishing",
  "Unlimited AI generations & templates",
]

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

/**
 * Soft-upsell banner shown in the builder when the tenant has no active
 * subscription. Publishing is never blocked — this only nudges and, on
 * subscribe, hides itself. Drives Razorpay Checkout end to end.
 */
export function UpgradeBanner({ subscribed }: { subscribed: boolean }) {
  const [active, setActive] = useState(subscribed)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<PlanKey | null>(null)
  const [error, setError] = useState("")

  if (active) return null

  async function handleSubscribe(plan: PlanKey) {
    setError("")
    setBusy(plan)
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout")
        return
      }

      // Dev fallback: no Razorpay keys, unlocked inline.
      if (data.dev) {
        setActive(true)
        setOpen(false)
        return
      }

      const Razorpay = await loadRazorpay()
      if (!Razorpay) {
        setError("Could not load the payment window. Check your connection.")
        return
      }

      const checkout = new Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: data.name ?? "0tox",
        description: `${data.planLabel} plan — ${data.priceLabel}`,
        prefill: { email: data.email },
        theme: { color: "#6d28d9" },
        handler: async (resp) => {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          })
          if (verify.ok) {
            setActive(true)
            setOpen(false)
          } else {
            setError("Payment captured but could not be verified. Refresh in a moment.")
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      })
      checkout.open()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 border-b border-brand/30 bg-gradient-to-r from-brand/10 to-brand/5 px-4 py-3"
        data-testid="upgrade-banner"
      >
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-brand shrink-0" />
          <span className="text-foreground">
            <span className="font-medium">Unlock your site&apos;s full potential</span>
            <span className="text-muted-foreground"> — remove branding, custom domain & more.</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="brand"
          onClick={() => setOpen(true)}
          data-testid="open-upgrade-dialog"
          className="shrink-0 font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
          Subscribe
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="upgrade-dialog">
          <DialogHeader>
            <DialogTitle>Unlock full potential</DialogTitle>
            <DialogDescription>
              Choose a plan to remove branding and unlock every feature.
            </DialogDescription>
          </DialogHeader>

          <ul className="my-2 space-y-1.5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-brand shrink-0" /> {perk}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            {PLAN_CARDS.map((p) => (
              <button
                key={p.key}
                onClick={() => handleSubscribe(p.key)}
                disabled={busy !== null}
                data-testid={`subscribe-${p.key}`}
                className={`relative flex flex-col items-start rounded-lg border p-4 text-left transition-all disabled:opacity-60 ${
                  p.highlight
                    ? "border-brand bg-gradient-to-br from-brand/15 to-brand/5 shadow-md hover:shadow-lg hover:scale-105 hover:border-brand/80"
                    : "border-border bg-card hover:border-brand/50 hover:shadow-sm"
                }`}
              >
                {p.highlight && (
                  <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    BEST VALUE
                  </span>
                )}
                <span className="text-sm font-medium">{p.label}</span>
                <span className="mt-1 text-2xl font-bold">
                  {p.price}
                  <span className="text-sm font-normal text-muted-foreground">{p.per}</span>
                </span>
                <span className="mt-1 text-xs text-muted-foreground">{p.blurb}</span>
                <span className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${p.highlight ? "text-brand font-semibold" : "text-brand"}`}>
                  {busy === p.key ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive" data-testid="upgrade-error">
              {error}
            </p>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Secure payments by Razorpay · Cancel anytime
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
