import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { MOCK_ORDERS } from "@/lib/mock-data"
import type { Order, OrderStatus } from "@/types"

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

type OrderRow = Order & { item_count: number }

export default async function AdminOrdersPage() {
  let orders: OrderRow[] = []

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const { getCurrentTenant } = await import("@/lib/tenant")
    const supabase = createClient()
    const tenant = await getCurrentTenant().catch(() => null)

    let query = supabase
      .from("orders")
      .select("*, order_items(id)")
      .order("created_at", { ascending: false })
    if (tenant?.id) query = query.eq("tenant_id", tenant.id)

    const { data } = await query
    orders = ((data ?? []) as unknown as (Order & { order_items?: { id: string }[] })[]).map(o => ({
      ...o,
      item_count: o.order_items?.length ?? 0,
    }))
  } else {
    orders = [...MOCK_ORDERS]
      .map(o => ({ ...o, item_count: o.items?.length ?? 0 }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">{orders.length} order{orders.length === 1 ? "" : "s"} total</p>
      </div>

      {!orders.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">No orders yet</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} data-testid={`order-row-${order.id}`}>
              <Card className="hover:border-foreground/20 transition-colors">
                <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{order.customer_name || order.customer_email}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customer_email}</p>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground w-28 text-center">
                    {order.item_count} item{order.item_count === 1 ? "" : "s"}
                  </div>
                  <div className="text-sm font-semibold w-24 text-right">
                    {formatCurrency(order.total, (order.currency || "usd").toUpperCase())}
                  </div>
                  <div className="w-24 flex justify-center">
                    <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground w-28 text-right">
                    {formatDate(order.created_at)}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
