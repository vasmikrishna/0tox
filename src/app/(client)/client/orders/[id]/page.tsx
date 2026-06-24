import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
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

export default async function ClientOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.id || !session.tenant_id) notFound()

  let order: Order | null = null
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()
    // The customer_id + tenant_id filters ensure a user can only open their own
    // order, and only within the business they're currently in.
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .eq("customer_id", session.id)
      .eq("tenant_id", session.tenant_id)
      .maybeSingle()
    order = (data as Order | null) ?? null
  } catch { /* treated as not found below */ }

  if (!order) notFound()

  const currency = (order.currency ?? "usd").toUpperCase()

  return (
    <div className="space-y-6" data-testid="client-order-detail">
      <Link href="/client/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>
        </div>
        <Badge variant={statusVariant[order.status] ?? "default"}>{order.status}</Badge>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty {item.quantity} · {formatCurrency(item.price, currency)} each</p>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity, currency)}</span>
            </div>
          ))}
          {(order.items?.length ?? 0) === 0 && (
            <div className="px-6 py-4 text-sm text-muted-foreground">No line items recorded.</div>
          )}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">{formatCurrency(order.total, currency)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
