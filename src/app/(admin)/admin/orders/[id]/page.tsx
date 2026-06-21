import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { OrderStatusAction } from "./order-actions"
import { MOCK_ORDERS } from "@/lib/mock-data"
import type { Order, OrderItem, OrderStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const statusVariant: Record<OrderStatus, "default" | "warning" | "success" | "brand" | "destructive"> = {
  pending: "warning",
  paid: "success",
  fulfilled: "brand",
  cancelled: "destructive",
  refunded: "default",
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let order: (Order & { items: OrderItem[] }) | null = null

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single()
    if (data) {
      const row = data as unknown as Order & { order_items?: OrderItem[] }
      order = { ...row, items: row.order_items ?? [] }
    }
  } else {
    const found = MOCK_ORDERS.find(o => o.id === id)
    if (found) order = { ...found, items: (found.items ?? []) as OrderItem[] }
  }

  if (!order) notFound()

  const currency = (order.currency || "usd").toUpperCase()
  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/orders" data-testid="order-back-link"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Order {order.id.slice(0, 8)}</h1>
              <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">Placed {formatDate(order.created_at)}</p>
          </div>
          <OrderStatusAction orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {order.items.length ? order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price, currency)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity, currency)}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No line items recorded for this order.</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium">Order total</span>
                <span className="text-lg font-bold" data-testid="order-total">{formatCurrency(order.total ?? itemsTotal, currency)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium">{order.customer_name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium break-all">{order.customer_email}</p>
              </div>
              {order.paid_at && (
                <div>
                  <p className="text-muted-foreground text-xs">Paid</p>
                  <p className="font-medium">{formatDate(order.paid_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
