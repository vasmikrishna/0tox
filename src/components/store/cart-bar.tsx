"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/components/store/cart-provider"

export function CartBar() {
  const { count } = useCart()

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/shop" className="text-sm font-semibold tracking-tight" data-testid="cart-bar-shop-link">
          Shop
        </Link>
        <Link
          href="/shop/cart"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="cart-bar-cart-link"
        >
          <ShoppingBag className="h-4 w-4" />
          <span data-testid="cart-bar-count">
            Cart{count > 0 ? ` (${count})` : ""}
          </span>
        </Link>
      </div>
    </div>
  )
}
