"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, EyeOff, Trash2, ExternalLink } from "lucide-react"
import type { PortfolioItem, ServiceTier } from "@/types"
import { MOCK_PORTFOLIO } from "@/lib/mock-data"
import { PaginatedList } from "@/components/paginated-list"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function AdminPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{ title: string; description: string; image_url: string; live_url: string; service_tier: ServiceTier | ""; tags: string }>({ title: "", description: "", image_url: "", live_url: "", service_tier: "", tags: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    if (!supabaseConfigured()) {
      setItems(MOCK_PORTFOLIO as any)
      setLoading(false)
      return
    }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data } = await supabase.from("portfolio_items").select("*").order("sort_order")
    setItems(data ?? MOCK_PORTFOLIO as any)
    setLoading(false)
  }

  async function addItem() {
    if (!form.title || !form.image_url) return
    setError("")
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean)
    const newItem: any = {
      id: `local-${Date.now()}`,
      title: form.title,
      description: form.description,
      image_url: form.image_url,
      live_url: form.live_url || null,
      service_tier: form.service_tier || null,
      tags,
      visible: true,
      sort_order: items.length + 1,
      created_at: new Date().toISOString(),
    }

    if (supabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data, error: err } = await supabase.from("portfolio_items").insert({
        title: form.title, description: form.description, image_url: form.image_url,
        live_url: form.live_url || null, service_tier: form.service_tier || null,
        tags, visible: true, sort_order: items.length + 1
      }).select().single()
      if (err) { setError(err.message); return }
      if (data) newItem.id = data.id
    }

    setItems(prev => [...prev, newItem])
    setForm({ title: "", description: "", image_url: "", live_url: "", service_tier: "", tags: "" })
    setAdding(false)
  }

  async function toggleVisible(id: string, visible: boolean) {
    if (supabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      await supabase.from("portfolio_items").update({ visible: !visible }).eq("id", id)
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, visible: !visible } : i))
  }

  async function deleteItem(id: string) {
    if (supabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      await supabase.from("portfolio_items").delete().eq("id", id)
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">Manage showcase items on the public site</p>
        </div>
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add item</Button>
      </div>

      {!supabaseConfigured() && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Demo mode — changes are local only and won&apos;t persist after refresh. Connect Supabase to save permanently.
        </div>
      )}

      {adding && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">New portfolio item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Image URL *</Label><Input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="space-y-1.5"><Label>Live URL</Label><Input value={form.live_url} onChange={e => setForm(p => ({ ...p, live_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="space-y-1.5">
                <Label>Service tier</Label>
                  <select value={form.service_tier} onChange={e => setForm(p => ({ ...p, service_tier: e.target.value as ServiceTier | "" }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background">
                  <option value="">Any</option>
                  <option value="starter">Starter</option>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e-commerce, React, Supabase" /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Image preview */}
            {form.image_url && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video w-48">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={addItem} disabled={!form.title || !form.image_url}>Add item</Button>
              <Button variant="ghost" onClick={() => { setAdding(false); setError("") }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="aspect-video bg-muted rounded-xl animate-pulse" />)}</div>
      ) : !items.length ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground text-sm">No portfolio items yet — add your first one above</CardContent></Card>
      ) : (
        <PaginatedList
          items={items}
          pageSize={12}
          searchPlaceholder="Search portfolio by title, description, tier, or tag..."
          testId="portfolio"
          searchText={(item) => `${item.title} ${item.description ?? ""} ${item.service_tier ?? ""} ${(item.tags as string[] | undefined)?.join(" ") ?? ""}`}
        >
          {(pageItems) => (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map((item) => (
            <Card key={item.id} className={!item.visible ? "opacity-50" : ""}>
              <div className="aspect-video bg-muted overflow-hidden rounded-t-xl">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    {item.live_url && item.live_url !== "#" && (
                      <a
                        href={item.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 truncate"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        {item.live_url}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {item.live_url && item.live_url !== "#" && (
                      <a href={item.live_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" title="Open live site">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button onClick={() => toggleVisible(item.id, item.visible)} className="text-muted-foreground hover:text-foreground" title={item.visible ? "Hide from public site" : "Show on public site"}>
                      {item.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                {item.tags && (item.tags as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1">{(item.tags as string[]).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </PaginatedList>
      )}
    </div>
  )
}
