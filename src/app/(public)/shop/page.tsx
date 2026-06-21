import Link from "next/link"
import { CheckCircle2, PackageOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddToCart } from "@/components/store/add-to-cart"
import { ClearCartOnSuccess } from "@/components/store/clear-cart-on-success"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import { getCurrentTenant } from "@/lib/tenant"
import type { Product } from "@/types"

export const metadata = { title: "Shop | 0toX" }

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`
}

async function getProducts(): Promise<Product[]> {
  const tenant = await getCurrentTenant().catch(() => null)
  try {
    if (!supabaseConfigured()) {
      return MOCK_PRODUCTS.filter(p => p.status === "active").filter(
        p => !tenant || !p.tenant_id || p.tenant_id === tenant.id
      )
    }
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    let query = supabase.from("products").select("*").eq("status", "active").order("sort_order", { ascending: true })
    if (tenant) query = query.eq("tenant_id", tenant.id)
    const { data } = await query
    const list = (data ?? []) as Product[]
    return list.length ? list : MOCK_PRODUCTS.filter(p => p.status === "active")
  } catch {
    return MOCK_PRODUCTS.filter(p => p.status === "active")
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const products = await getProducts()
  const orderSuccess = order === "success"

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {orderSuccess && (
        <>
          <ClearCartOnSuccess />
          <div
            className="mb-8 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800"
            data-testid="order-success-banner"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Thanks for your order! A confirmation is on its way.</p>
          </div>
        </>
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="text-muted-foreground mt-2">Products from the studio.</p>
      </div>

      {products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center"
          data-testid="shop-empty"
        >
          <PackageOpen className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => {
            const onSale = product.sale_price != null && product.sale_price < product.price
            const outOfStock = product.manage_stock && product.stock_quantity <= 0
            return (
              <Card
                key={product.id}
                className="overflow-hidden group flex flex-col hover:border-foreground/30 transition-colors"
                data-testid={`product-card-${product.slug}`}
              >
                <Link href={`/shop/${product.slug}`} className="block aspect-square bg-muted overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <PackageOpen className="h-8 w-8" />
                    </div>
                  )}
                </Link>
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/shop/${product.slug}`} className="font-semibold hover:underline">
                      {product.name}
                    </Link>
                    {onSale && <Badge variant="brand" className="text-xs flex-shrink-0">Sale</Badge>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-bold">{formatPrice(onSale ? product.sale_price! : product.price)}</span>
                    {onSale && (
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  {outOfStock && <p className="mt-1 text-xs text-muted-foreground">Out of stock</p>}
                  <div className="mt-4 pt-1">
                    <AddToCart product={product} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
