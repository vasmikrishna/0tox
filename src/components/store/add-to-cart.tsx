"use client"

import * as React from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/store/cart-provider"
import type { Product } from "@/types"

interface AddToCartProps {
  product: Product
  /** Show a +/- quantity stepper next to the button (used on detail pages). */
  withStepper?: boolean
}

export function AddToCart({ product, withStepper = false }: AddToCartProps) {
  const { add } = useCart()
  const [qty, setQty] = React.useState(1)
  const [added, setAdded] = React.useState(false)

  const outOfStock = product.manage_stock && product.stock_quantity <= 0
  const maxQty = product.manage_stock ? product.stock_quantity : Infinity

  const handleAdd = () => {
    if (outOfStock) return
    add(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.sale_price ?? product.price,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        manage_stock: product.manage_stock,
      },
      qty
    )
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  if (outOfStock) {
    return (
      <Button variant="outline" size="sm" disabled data-testid={`add-to-cart-${product.slug}`}>
        Out of stock
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {withStepper && (
        <div className="flex items-center rounded-lg border border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            disabled={qty <= 1}
            data-testid={`qty-dec-${product.slug}`}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-9 text-center text-sm tabular-nums" data-testid={`qty-value-${product.slug}`}>
            {qty}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setQty(q => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            data-testid={`qty-inc-${product.slug}`}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="brand"
        size={withStepper ? "default" : "sm"}
        onClick={handleAdd}
        data-testid={`add-to-cart-${product.slug}`}
      >
        <ShoppingCart className="h-4 w-4" />
        {added ? "Added!" : "Add to cart"}
      </Button>
    </div>
  )
}
