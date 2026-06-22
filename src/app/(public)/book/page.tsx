"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, Clock, Send, CheckCircle2 } from "lucide-react"

type BusyRange = { starts_at: string; ends_at: string }
type BlockRange = { starts_at: string; ends_at: string; all_day: boolean; title: string }

const DURATIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "1.5 hours", minutes: 90 },
  { label: "2 hours", minutes: 120 },
]

function overlaps(aStart: number, aEnd: number, bStart: string, bEnd: string) {
  const s = new Date(bStart).getTime()
  const e = new Date(bEnd).getTime()
  return aStart < e && aEnd > s
}

export default function BookPage() {
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    service: "", starts_at: "", notes: "",
  })
  const [minutes, setMinutes] = useState(60)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<BusyRange[]>([])
  const [blocks, setBlocks] = useState<BlockRange[]>([])

  useEffect(() => {
    fetch("/api/book")
      .then(r => r.json())
      .then(d => { setBusy(d.busy ?? []); setBlocks(d.blocks ?? []) })
      .catch(() => {})
  }, [])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Client-side soft warning before submit (server still enforces).
  const startMs = form.starts_at ? new Date(form.starts_at).getTime() : NaN
  const endMs = Number.isNaN(startMs) ? NaN : startMs + minutes * 60_000
  const conflict = !Number.isNaN(startMs) && (
    busy.some(b => overlaps(startMs, endMs, b.starts_at, b.ends_at)) ||
    blocks.some(b => overlaps(startMs, endMs, b.starts_at, b.ends_at))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus("sending")
    const ends_at = new Date(new Date(form.starts_at).getTime() + minutes * 60_000).toISOString()
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ends_at }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus("sent")
      } else {
        setError(data.error ?? "Something went wrong. Please try again.")
        setStatus("error")
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">Book an Appointment</h1>
          <p className="mt-3 text-white/70 max-w-xl text-lg">
            Pick a time that works for you. We&apos;ll confirm your booking by email.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {status === "sent" ? (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center" data-testid="book-success">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--site-accent)" }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--site-primary)" }}>Request received!</h2>
              <p className="text-gray-600">
                Thanks, {form.customer_name.split(" ")[0] || "there"}. Your appointment request is pending —
                we&apos;ll email {form.customer_email} once it&apos;s confirmed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8" data-testid="book-form">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your name *">
                  <input data-testid="book-name" required value={form.customer_name}
                    onChange={e => set("customer_name", e.target.value)} className={inputCls} placeholder="Jane Doe" />
                </Field>
                <Field label="Email *">
                  <input data-testid="book-email" type="email" required value={form.customer_email}
                    onChange={e => set("customer_email", e.target.value)} className={inputCls} placeholder="jane@example.com" />
                </Field>
                <Field label="Phone">
                  <input data-testid="book-phone" value={form.customer_phone}
                    onChange={e => set("customer_phone", e.target.value)} className={inputCls} placeholder="Optional" />
                </Field>
                <Field label="Service">
                  <input data-testid="book-service" value={form.service}
                    onChange={e => set("service", e.target.value)} className={inputCls} placeholder="What's this for?" />
                </Field>
                <Field label="Preferred date & time *">
                  <input data-testid="book-starts" type="datetime-local" required value={form.starts_at}
                    onChange={e => set("starts_at", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Duration">
                  <select data-testid="book-duration" value={minutes}
                    onChange={e => setMinutes(Number(e.target.value))} className={inputCls}>
                    {DURATIONS.map(d => <option key={d.minutes} value={d.minutes}>{d.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Notes" className="mt-4">
                <textarea data-testid="book-notes" rows={3} value={form.notes}
                  onChange={e => set("notes", e.target.value)} className={inputCls} placeholder="Anything we should know? (optional)" />
              </Field>

              {conflict && (
                <p className="mt-4 text-sm rounded-md bg-amber-50 text-amber-800 px-3 py-2 flex items-center gap-2" data-testid="book-conflict">
                  <Clock className="h-4 w-4 shrink-0" />
                  That time looks unavailable. You can still submit, but another slot is more likely to be confirmed.
                </p>
              )}

              {error && <p className="mt-4 text-sm text-red-600" data-testid="book-error">{error}</p>}

              <button
                type="submit"
                data-testid="book-submit"
                disabled={status === "sending"}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium disabled:opacity-60"
                style={{ background: "var(--site-primary)" }}
              >
                {status === "sending"
                  ? <>Submitting…</>
                  : <><Send className="h-4 w-4" /> Request appointment</>}
              </button>
            </form>
          )}

          {/* Upcoming unavailable periods (transparency) */}
          {status !== "sent" && blocks.length > 0 && (
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5" data-testid="book-blocks">
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--site-primary)" }}>
                <CalendarCheck className="h-4 w-4" /> Upcoming unavailable times
              </h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {blocks.slice(0, 6).map((b, i) => (
                  <li key={i}>
                    <span className="font-medium">{b.title}</span> —{" "}
                    {b.all_day
                      ? new Date(b.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                      : `${new Date(b.starts_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} – ${new Date(b.ends_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--site-primary)]/30"

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  )
}
