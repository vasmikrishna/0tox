import { Card, CardContent } from "@/components/ui/card"
import { MOCK_ORDERS } from "@/lib/mock-data"
import type { Order } from "@/types"
import { OrdersList } from "./orders-list"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
        <OrdersList orders={orders} />
      )}
    </div>
  )
}
