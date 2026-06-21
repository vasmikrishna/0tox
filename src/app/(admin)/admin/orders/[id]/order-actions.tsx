"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { OrderStatus } from "@/types"

const JSON_HEADERS = { "Content-Type": "application/json" }
const STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"]

export function OrderStatusAction({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter()
  const [current, setCurrent] = useState<OrderStatus>(status)
  const [saving, setSaving] = useState(false)

  async function updateStatus(next: OrderStatus) {
    setSaving(true)
    setCurrent(next)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: next }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={e => updateStatus(e.target.value as OrderStatus)}
      data-testid="order-status-select"
      className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring capitalize"
    >
      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
    </select>
  )
}
