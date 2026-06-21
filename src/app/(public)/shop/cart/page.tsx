"use client"

import * as React from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/components/store/cart-provider"

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`
}

export default function CartPage() {
  const { items, setQty, remove, total } = useCart()
  const [email, setEmail] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleCheckout = async () => {
    if (!items.length) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          customer_email: email.trim() || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout failed. Please try again.")
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center" data-testid="cart-empty">
        <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground mt-2">Browse the shop and add something you like.</p>
        <Button asChild variant="brand" className="mt-6" data-testid="cart-empty-shop-link">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => {
            const maxQty = item.manage_stock ? item.stock_quantity : Infinity
            return (
              <Card key={item.product_id} data-testid={`cart-item-${item.product_id}`}>
                <CardContent className="p-4 flex gap-4">
                  <Link href={`/shop/${item.slug}`} className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.slug}`} className="font-semibold hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">{formatPrice(item.price)} each</p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQty(item.product_id, item.quantity - 1)}
                          data-testid={`cart-qty-dec-${item.product_id}`}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <input
                          type="number"
                          min={1}
                          max={item.manage_stock ? item.stock_quantity : undefined}
                          value={item.quantity}
                          onChange={e => {
                            const v = parseInt(e.target.value, 10)
                            if (!Number.isNaN(v)) setQty(item.product_id, v)
                          }}
                          className="h-8 w-12 border-x border-border bg-background text-center text-sm tabular-nums focus-visible:outline-none"
                          data-testid={`cart-qty-${item.product_id}`}
                          aria-label="Quantity"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQty(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= maxQty}
                          data-testid={`cart-qty-inc-${item.product_id}`}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.product_id)}
                        data-testid={`cart-remove-${item.product_id}`}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>

                  <div className="text-right font-semibold tabular-nums" data-testid={`cart-line-total-${item.product_id}`}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span data-testid="cart-total" className="tabular-nums">{formatPrice(total)}</span>
              </div>

              <div>
                <label htmlFor="checkout-email" className="text-sm text-muted-foreground">
                  Email (optional)
                </label>
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1"
                  data-testid="checkout-email"
                />
              </div>

              {error && <p className="text-sm text-destructive" data-testid="checkout-error">{error}</p>}

              <Button
                type="button"
                variant="brand"
                className="w-full"
                onClick={handleCheckout}
                loading={submitting}
                disabled={submitting}
                data-testid="checkout-btn"
              >
                Checkout
              </Button>

              <Button asChild variant="ghost" size="sm" className="w-full" data-testid="cart-continue-shopping">
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
