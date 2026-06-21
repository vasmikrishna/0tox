import { ProductsAdmin } from "./products-admin"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import type { Product } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminProductsPage() {
  let products: Product[] = MOCK_PRODUCTS

  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server")
    const { getCurrentTenant } = await import("@/lib/tenant")
    const supabase = createClient()
    const tenant = await getCurrentTenant().catch(() => null)

    let query = supabase.from("products").select("*").order("sort_order", { ascending: true })
    if (tenant?.id) query = query.eq("tenant_id", tenant.id)

    const { data } = await query
    products = (data as Product[] | null) ?? []
  }

  return <ProductsAdmin products={products} />
}
