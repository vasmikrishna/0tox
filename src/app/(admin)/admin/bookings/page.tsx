"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CalendarClock, CalendarOff, Plus, Trash2, Check, X, CheckCheck,
  Clock, RefreshCw, Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Booking, BookingStatus, CalendarBlock } from "@/types"

type Tab = "manage" | "block"
type Counts = { all: number; pending: number; confirmed: number; completed: number; cancelled: number }

const STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-gray-200 text-gray-600 line-through" },
}

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

function fmtDay(dt: string) {
  return new Date(dt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export default function BookingsPage() {
  const [tab, setTab] = useState<Tab>("manage")

  return (
    <div data-testid="bookings-page">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage customer appointments and block out time when you&apos;re unavailable.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        <button
          data-testid="bookings-tab-manage"
          onClick={() => setTab("manage")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "manage"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarClock className="h-4 w-4" />
          Booking management
        </button>
        <button
          data-testid="bookings-tab-block"
          onClick={() => setTab("block")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "block"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarOff className="h-4 w-4" />
          Block the calendar
        </button>
      </div>

      {tab === "manage" ? <ManageTab /> : <BlockTab />}
    </div>
  )
}

/* ------------------------------- Manage tab ------------------------------- */

const STATUS_FILTERS: { key: keyof Counts; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
]

function ManageTab() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [counts, setCounts] = useState<Counts>({ all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
  const [filter, setFilter] = useState<keyof Counts>("all")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async (f: keyof Counts) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings?status=${f}`)
      const data = await res.json()
      setBookings(data.bookings ?? [])
      setCounts(data.counts ?? { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  async function setStatus(id: string, status: BookingStatus) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load(filter)
  }

  async function remove(id: string) {
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" })
    load(filter)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_FILTERS.map(f => {
            const active = filter === f.key
            const count = counts[f.key]
            return (
              <button
                key={f.key}
                data-testid={`bookings-filter-${f.key}`}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors",
                  active ? "bg-foreground text-background" : "bg-accent text-foreground hover:bg-accent/70",
                )}
              >
                {f.label}
                <span className="text-xs opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="bookings-refresh" onClick={() => load(filter)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" data-testid="bookings-new-toggle" onClick={() => setShowForm(s => !s)}>
            <Plus className="h-4 w-4 mr-1" /> New booking
          </Button>
        </div>
      </div>

      {showForm && (
        <NewBookingForm
          onCreated={() => { setShowForm(false); load(filter) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && bookings.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="border border-border rounded-lg p-10 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No bookings</p>
          <p className="text-xs mt-1">New appointments will appear here.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {bookings.map(b => {
            const meta = STATUS_META[b.status]
            return (
              <div key={b.id} data-testid={`booking-row-${b.id}`} className="p-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.customer_name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", meta.className)}>{meta.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {fmt(b.starts_at)} – {fmt(b.ends_at)}
                  </p>
                  {b.service && <p className="text-sm mt-1">{b.service}</p>}
                  {(b.customer_email || b.customer_phone) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[b.customer_email, b.customer_phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {b.status === "pending" && (
                    <Button size="sm" variant="outline" data-testid={`booking-confirm-${b.id}`} onClick={() => setStatus(b.id, "confirmed")}>
                      <Check className="h-4 w-4 mr-1" /> Confirm
                    </Button>
                  )}
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="outline" data-testid={`booking-complete-${b.id}`} onClick={() => setStatus(b.id, "completed")}>
                      <CheckCheck className="h-4 w-4 mr-1" /> Complete
                    </Button>
                  )}
                  {b.status !== "cancelled" && b.status !== "completed" && (
                    <Button size="sm" variant="ghost" data-testid={`booking-cancel-${b.id}`} onClick={() => setStatus(b.id, "cancelled")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" data-testid={`booking-delete-${b.id}`} onClick={() => remove(b.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NewBookingForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    service: "", starts_at: "", ends_at: "", notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Failed to create booking")
        return
      }
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 mb-4 bg-card" data-testid="booking-form">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder="Customer name *" data-testid="booking-field-name" value={form.customer_name} onChange={e => set("customer_name", e.target.value)} />
        <Input placeholder="Service (optional)" data-testid="booking-field-service" value={form.service} onChange={e => set("service", e.target.value)} />
        <Input type="email" placeholder="Email (optional)" data-testid="booking-field-email" value={form.customer_email} onChange={e => set("customer_email", e.target.value)} />
        <Input placeholder="Phone (optional)" data-testid="booking-field-phone" value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)} />
        <label className="text-sm">
          <span className="text-muted-foreground text-xs">Starts</span>
          <Input type="datetime-local" data-testid="booking-field-starts" value={form.starts_at} onChange={e => set("starts_at", e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground text-xs">Ends</span>
          <Input type="datetime-local" data-testid="booking-field-ends" value={form.ends_at} onChange={e => set("ends_at", e.target.value)} />
        </label>
      </div>
      <Textarea className="mt-3" placeholder="Notes (optional)" data-testid="booking-field-notes" value={form.notes} onChange={e => set("notes", e.target.value)} />
      {error && <p className="text-sm text-red-500 mt-2" data-testid="booking-form-error">{error}</p>}
      <div className="flex items-center gap-2 mt-3">
        <Button size="sm" data-testid="booking-form-save" disabled={saving} onClick={submit}>
          {saving ? "Saving…" : "Create booking"}
        </Button>
        <Button size="sm" variant="ghost" data-testid="booking-form-cancel" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

/* -------------------------------- Block tab ------------------------------- */

function BlockTab() {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: "", starts_at: "", ends_at: "", all_day: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/calendar-blocks")
      const data = await res.json()
      setBlocks(data.blocks ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/calendar-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Failed to block time")
        return
      }
      setForm({ title: "", starts_at: "", ends_at: "", all_day: false })
      load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/calendar-blocks/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      {/* Add block form */}
      <div className="border border-border rounded-lg p-4 bg-card h-fit" data-testid="block-form">
        <h2 className="font-medium mb-1">Block out time</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Customers can&apos;t be booked during blocked periods.
        </p>
        <div className="space-y-3">
          <Input placeholder="Reason (e.g. Public holiday)" data-testid="block-field-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <label className="block text-sm">
            <span className="text-muted-foreground text-xs">From</span>
            <Input type={form.all_day ? "date" : "datetime-local"} data-testid="block-field-starts" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground text-xs">To</span>
            <Input type={form.all_day ? "date" : "datetime-local"} data-testid="block-field-ends" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" data-testid="block-field-allday" checked={form.all_day} onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))} />
            All day
          </label>
          {error && <p className="text-sm text-red-500" data-testid="block-form-error">{error}</p>}
          <Button className="w-full" data-testid="block-form-save" disabled={saving} onClick={submit}>
            <CalendarOff className="h-4 w-4 mr-1.5" /> {saving ? "Blocking…" : "Block this time"}
          </Button>
        </div>
      </div>

      {/* Existing blocks */}
      <div>
        <h2 className="font-medium mb-3">Blocked periods</h2>
        {loading && blocks.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Loading…</div>
        ) : blocks.length === 0 ? (
          <div className="border border-border rounded-lg p-10 text-center text-muted-foreground">
            <CalendarOff className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nothing blocked</p>
            <p className="text-xs mt-1">Your calendar is fully open for bookings.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {blocks.map(blk => (
              <div key={blk.id} data-testid={`block-row-${blk.id}`} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{blk.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {blk.all_day
                      ? `${fmtDay(blk.starts_at)}${blk.ends_at.slice(0, 10) !== blk.starts_at.slice(0, 10) ? ` – ${fmtDay(blk.ends_at)}` : ""} · All day`
                      : `${fmt(blk.starts_at)} – ${fmt(blk.ends_at)}`}
                  </p>
                </div>
                <Button size="sm" variant="ghost" data-testid={`block-delete-${blk.id}`} onClick={() => remove(blk.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
