"use client"

import * as React from "react"
import { useCart } from "@/components/store/cart-provider"

/** Clears the cart once on mount — rendered only when ?order=success. */
export function ClearCartOnSuccess() {
  const { clear } = useCart()
  React.useEffect(() => {
    clear()
  }, [clear])
  return null
}
