import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import { MOCK_PRODUCTS } from "@/lib/mock-data"
import type { ProductStatus } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STATUSES: ProductStatus[] = ["draft", "active", "archived"]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET — list products (admin only)
export async function GET() {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ products: MOCK_PRODUCTS })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  let query = supabase.from("products").select("*").order("sort_order", { ascending: true })
  if (tenant?.id) query = query.eq("tenant_id", tenant.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ products: data ?? [] })
}

// POST — create a product (admin only)
export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const price = typeof body.price === "number" ? body.price : Number(body.price)

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "A valid price is required" }, { status: 400 })
  }

  const slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name)
  const status: ProductStatus = STATUSES.includes(body.status as ProductStatus)
    ? (body.status as ProductStatus)
    : "draft"

  const salePriceRaw = body.sale_price
  const sale_price =
    salePriceRaw === null || salePriceRaw === undefined || salePriceRaw === ""
      ? null
      : Number(salePriceRaw)

  const record = {
    name,
    slug,
    description: typeof body.description === "string" ? body.description : null,
    price,
    sale_price: sale_price !== null && Number.isFinite(sale_price) ? sale_price : null,
    sku: typeof body.sku === "string" ? body.sku : null,
    stock_quantity: Number.isFinite(Number(body.stock_quantity)) ? Math.trunc(Number(body.stock_quantity)) : 0,
    manage_stock: body.manage_stock !== false,
    status,
    image_url: typeof body.image_url === "string" ? body.image_url : null,
    images: Array.isArray(body.images) ? body.images : [],
    category: typeof body.category === "string" ? body.category : null,
    sort_order: Number.isFinite(Number(body.sort_order)) ? Math.trunc(Number(body.sort_order)) : 0,
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({
      product: {
        id: `local-${Date.now()}`,
        tenant_id: null,
        ...record,
        created_at: new Date().toISOString(),
      },
    })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)

  const { data, error } = await supabase
    .from("products")
    .insert({ ...record, tenant_id: tenant?.id ?? null } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ product: data })
}
