"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import type { Order, OrderStatus } from "@/types"
import { PaginatedList } from "@/components/paginated-list"

const statusVariant: Record<OrderStatus, "default" | "warning" | "success" | "brand" | "destructive"> = {
  pending: "warning",
  paid: "success",
  fulfilled: "brand",
  cancelled: "destructive",
  refunded: "default",
}

type OrderRow = Order & { item_count: number }

export function OrdersList({ orders }: { orders: OrderRow[] }) {
  return (
    <PaginatedList
      items={orders}
      pageSize={10}
      searchPlaceholder="Search orders by customer, email, or status..."
      testId="orders"
      searchText={(o: OrderRow) => `${o.customer_name ?? ""} ${o.customer_email ?? ""} ${o.status}`}
    >
      {(pageOrders) => (
        <div className="space-y-2">
          {pageOrders.map(order => (
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
    </PaginatedList>
  )
}
