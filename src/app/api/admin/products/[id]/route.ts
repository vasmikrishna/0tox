import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
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

// PATCH — partial update of a product (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}

  if (typeof body.name === "string") update.name = body.name.trim()
  if (typeof body.slug === "string" && body.slug.trim()) update.slug = slugify(body.slug)
  if (typeof body.description === "string") update.description = body.description
  if (body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }
    update.price = price
  }
  if (body.sale_price !== undefined) {
    if (body.sale_price === null || body.sale_price === "") {
      update.sale_price = null
    } else {
      const sale = Number(body.sale_price)
      update.sale_price = Number.isFinite(sale) ? sale : null
    }
  }
  if (typeof body.sku === "string") update.sku = body.sku
  if (body.stock_quantity !== undefined) {
    const qty = Number(body.stock_quantity)
    update.stock_quantity = Number.isFinite(qty) ? Math.max(0, Math.trunc(qty)) : 0
  }
  if (typeof body.manage_stock === "boolean") update.manage_stock = body.manage_stock
  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status as ProductStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    update.status = body.status
  }
  if (typeof body.image_url === "string") update.image_url = body.image_url
  if (typeof body.category === "string") update.category = body.category
  if (body.sort_order !== undefined) {
    const order = Number(body.sort_order)
    update.sort_order = Number.isFinite(order) ? Math.trunc(order) : 0
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ product: { id, ...update } })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .update(update as never)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ product: data })
}

// DELETE — remove a product (admin only)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  if (!supabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  const supabase = createClient()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
