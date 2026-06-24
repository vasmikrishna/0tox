import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import { getSession } from "@/lib/session"
import type { Order } from "@/types"

const statusVariant: Record<string, "default" | "warning" | "brand" | "success" | "destructive"> = {
  pending: "warning",
  paid: "brand",
  fulfilled: "success",
  cancelled: "destructive",
  refunded: "destructive",
}

export const dynamic = "force-dynamic"

export default async function ClientOrdersPage() {
  const session = await getSession()
  let orders: Order[] = []

  if (session?.id && session.tenant_id) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      // Scope strictly to this customer AND this tenant — no cross-tenant leakage.
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("customer_id", session.id)
        .eq("tenant_id", session.tenant_id)
        .order("created_at", { ascending: false })
      orders = (data as Order[] | null) ?? []
    } catch { /* fall through to empty state */ }
  }

  return (
    <div className="space-y-8" data-testid="client-orders">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="mt-1 text-muted-foreground">Your purchases from this business</p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="transition-colors hover:border-foreground/20">
              <CardContent className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? "" : "s"}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatCurrency(order.total, (order.currency ?? "usd").toUpperCase())}</span>
                  <Badge variant={statusVariant[order.status] ?? "default"}>{order.status}</Badge>
                  <Link href={`/client/orders/${order.id}`} className="text-muted-foreground hover:text-foreground" data-testid={`order-link-${order.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
