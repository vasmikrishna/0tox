"use client"

import * as React from "react"
import type { CartItem } from "@/types"

const STORAGE_KEY = "0tox_cart"

interface CartContextValue {
  items: CartItem[]
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void
  remove: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
  count: number
  total: number
}

const CartContext = React.createContext<CartContextValue | null>(null)

/** Clamp a quantity to [1, stock] when stock is managed, else floor at 1. */
function clampQty(qty: number, item: Pick<CartItem, "manage_stock" | "stock_quantity">): number {
  const next = Math.max(1, Math.floor(qty))
  if (item.manage_stock) return Math.min(next, Math.max(0, item.stock_quantity))
  return next
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  // Read from localStorage on mount (SSR-safe).
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed as CartItem[])
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  // Persist on change (only after the initial read, to avoid clobbering).
  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota/serialization errors
    }
  }, [items, hydrated])

  const add = React.useCallback((item: Omit<CartItem, "quantity">, qty: number = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === item.product_id)
      if (existing) {
        return prev.map(i =>
          i.product_id === item.product_id
            ? { ...i, ...item, quantity: clampQty(i.quantity + qty, item) }
            : i
        )
      }
      return [...prev, { ...item, quantity: clampQty(qty, item) }]
    })
  }, [])

  const remove = React.useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }, [])

  const setQty = React.useCallback((productId: string, qty: number) => {
    setItems(prev =>
      prev.flatMap(i => {
        if (i.product_id !== productId) return [i]
        if (qty <= 0) return []
        return [{ ...i, quantity: clampQty(qty, i) }]
      })
    )
  }, [])

  const clear = React.useCallback(() => setItems([]), [])

  const count = React.useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const total = React.useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])

  const value = React.useMemo<CartContextValue>(
    () => ({ items, add, remove, setQty, clear, count, total }),
    [items, add, remove, setQty, clear, count, total]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}
