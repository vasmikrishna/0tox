import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, PackageOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AddToCart } from "@/components/store/add-to-cart"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import { getCurrentTenant } from "@/lib/tenant"
import type { Product } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`
}

async function getProduct(slug: string): Promise<Product | null> {
  const tenant = await getCurrentTenant().catch(() => null)
  try {
    if (!supabaseConfigured()) {
      const p = MOCK_PRODUCTS.find(pr => pr.slug === slug && pr.status === "active")
      if (!p) return null
      if (tenant && p.tenant_id && p.tenant_id !== tenant.id) return null
      return p
    }
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    let query = supabase.from("products").select("*").eq("slug", slug).eq("status", "active")
    if (tenant) query = query.eq("tenant_id", tenant.id)
    const { data } = await query.maybeSingle()
    if (data) return data as Product
    // Fall back to mock when DB has nothing (keeps local dev demoable).
    return MOCK_PRODUCTS.find(pr => pr.slug === slug && pr.status === "active") ?? null
  } catch {
    return MOCK_PRODUCTS.find(pr => pr.slug === slug && pr.status === "active") ?? null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Product not found | 0toX" }
  return { title: `${product.name} | 0toX` }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const onSale = product.sale_price != null && product.sale_price < product.price
  const outOfStock = product.manage_stock && product.stock_quantity <= 0
  const lowStock = product.manage_stock && product.stock_quantity > 0 && product.stock_quantity <= 5

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        data-testid="back-to-shop"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square rounded-xl border border-border bg-muted overflow-hidden">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <PackageOpen className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && (
            <Badge variant="outline" className="self-start text-xs mb-3">
              {product.category}
            </Badge>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              {formatPrice(onSale ? product.sale_price! : product.price)}
            </span>
            {onSale && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
            )}
            {onSale && <Badge variant="brand" className="text-xs">Sale</Badge>}
          </div>

          <div className="mt-3 text-sm" data-testid="stock-status">
            {outOfStock ? (
              <span className="text-muted-foreground">Out of stock</span>
            ) : lowStock ? (
              <span className="text-amber-600">Only {product.stock_quantity} left in stock</span>
            ) : (
              <span className="text-green-600">In stock</span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCart product={product} withStepper />
          </div>
        </div>
      </div>
    </div>
  )
}
