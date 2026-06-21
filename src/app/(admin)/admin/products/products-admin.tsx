"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, Minus, Trash2 } from "lucide-react"
import type { Product, ProductStatus } from "@/types"

const JSON_HEADERS = { "Content-Type": "application/json" }
const STATUSES: ProductStatus[] = ["draft", "active", "archived"]

const statusVariant: Record<ProductStatus, "success" | "default" | "warning"> = {
  active: "success",
  draft: "warning",
  archived: "default",
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type ProductForm = {
  name: string
  slug: string
  price: string
  sale_price: string
  sku: string
  stock_quantity: string
  manage_stock: boolean
  status: ProductStatus
  image_url: string
  category: string
}

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  price: "",
  sale_price: "",
  sku: "",
  stock_quantity: "0",
  manage_stock: true,
  status: "draft",
  image_url: "",
  category: "",
}

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function ProductsAdmin({ products }: { products: Product[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Product[]>(products)
  const [adding, setAdding] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function resetForm() {
    setForm(EMPTY_FORM)
    setSlugEdited(false)
    setError("")
  }

  function onNameChange(name: string) {
    setForm(p => ({ ...p, name, slug: slugEdited ? p.slug : slugify(name) }))
  }

  async function addProduct() {
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        price: Number(form.price),
        sale_price: form.sale_price === "" ? null : Number(form.sale_price),
        sku: form.sku.trim() || undefined,
        stock_quantity: Number(form.stock_quantity || "0"),
        manage_stock: form.manage_stock,
        status: form.status,
        image_url: form.image_url.trim() || undefined,
        category: form.category.trim() || undefined,
        sort_order: items.length + 1,
      }),
    })
    const payload = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(payload.error ?? "Failed to create product")
      return
    }
    if (payload.product) setItems(prev => [...prev, payload.product as Product])
    resetForm()
    setAdding(false)
    router.refresh()
  }

  async function patchProduct(id: string, updates: Partial<Product>) {
    setItems(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)))
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(updates),
    })
    router.refresh()
  }

  async function adjustStock(product: Product, delta: number) {
    const next = Math.max(0, product.stock_quantity + delta)
    await patchProduct(product.id, { stock_quantity: next })
  }

  async function deleteProduct(id: string) {
    setItems(prev => prev.filter(p => p.id !== id))
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    router.refresh()
  }

  function stockBadge(product: Product) {
    if (!product.manage_stock) {
      return <span className="text-xs text-muted-foreground">Unmanaged</span>
    }
    if (product.stock_quantity === 0) {
      return <Badge variant="destructive" data-testid={`product-stock-status-${product.id}`}>Out of stock</Badge>
    }
    if (product.stock_quantity <= 5) {
      return <Badge variant="warning" data-testid={`product-stock-status-${product.id}`}>Low</Badge>
    }
    return <span className="text-xs text-muted-foreground">In stock</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">{items.length} product{items.length === 1 ? "" : "s"}</p>
        </div>
        <Button variant="brand" onClick={() => setAdding(a => !a)} data-testid="product-add-toggle-btn">
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      {!supabaseConfigured() && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Demo mode — changes are local only and won&apos;t persist after refresh. Connect Supabase to save permanently.
        </div>
      )}

      {adding && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">New product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-name">Name *</Label>
                <Input id="product-name" data-testid="product-name-input" value={form.name} onChange={e => onNameChange(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-slug">Slug</Label>
                <Input id="product-slug" data-testid="product-slug-input" value={form.slug} onChange={e => { setSlugEdited(true); setForm(p => ({ ...p, slug: e.target.value })) }} placeholder="auto-from-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-price">Price *</Label>
                <Input id="product-price" data-testid="product-price-input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-sale-price">Sale price</Label>
                <Input id="product-sale-price" data-testid="product-sale-price-input" type="number" min="0" step="0.01" value={form.sale_price} onChange={e => setForm(p => ({ ...p, sale_price: e.target.value }))} placeholder="optional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-sku">SKU</Label>
                <Input id="product-sku" data-testid="product-sku-input" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-stock">Stock quantity</Label>
                <Input id="product-stock" data-testid="product-stock-input" type="number" min="0" step="1" value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-category">Category</Label>
                <Input id="product-category" data-testid="product-category-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-status">Status</Label>
                <select
                  id="product-status"
                  data-testid="product-status-select"
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value as ProductStatus }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="product-image">Image URL</Label>
                <Input id="product-image" data-testid="product-image-url-input" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                data-testid="product-manage-stock-toggle"
                checked={form.manage_stock}
                onChange={e => setForm(p => ({ ...p, manage_stock: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              Track stock quantity
            </label>

            {form.image_url && (
              <div className="rounded-lg overflow-hidden border border-border aspect-square w-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}

            {error && <p className="text-sm text-destructive" data-testid="product-form-error">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={addProduct} loading={saving} disabled={!form.name.trim() || !form.price} data-testid="product-add-btn">Add product</Button>
              <Button variant="ghost" onClick={() => { setAdding(false); resetForm() }} data-testid="product-add-cancel-btn">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!items.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">No products yet — add your first one above</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(product => {
            const onSale = product.sale_price != null && product.sale_price < product.price
            return (
              <Card key={product.id}>
                <CardContent className="flex items-center gap-4 py-4 px-5">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {product.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.sku ? `${product.sku} · ` : ""}{product.category ?? "Uncategorized"}
                    </p>
                  </div>

                  <div className="text-right w-24 flex-shrink-0">
                    {onSale ? (
                      <div>
                        <span className="text-sm font-semibold">{formatCurrency(product.sale_price as number)}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold">{formatCurrency(product.price)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-44 flex-shrink-0 justify-end">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => adjustStock(product, -1)}
                      disabled={!product.manage_stock || product.stock_quantity <= 0}
                      data-testid={`product-stock-dec-${product.id}`}
                      aria-label="Decrease stock"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-sm tabular-nums w-6 text-center" data-testid={`product-stock-qty-${product.id}`}>{product.stock_quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => adjustStock(product, 1)}
                      disabled={!product.manage_stock}
                      data-testid={`product-stock-inc-${product.id}`}
                      aria-label="Increase stock"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <div className="w-20">{stockBadge(product)}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={product.status}
                      onChange={e => patchProduct(product.id, { status: e.target.value as ProductStatus })}
                      data-testid={`product-status-select-${product.id}`}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <Badge variant={statusVariant[product.status]}>{product.status}</Badge>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete product"
                      data-testid={`product-delete-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
