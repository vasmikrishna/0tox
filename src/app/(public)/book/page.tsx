"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, ArrowLeft } from "lucide-react"

type Slot = { starts_at: string; ends_at: string; label: string }
type Step = "date" | "time" | "details" | "done"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function BookPage() {
  const [step, setStep] = useState<Step>("date")

  // Config from the business
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6])
  const [slotMinutes, setSlotMinutes] = useState(60)

  // Selected values
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  // Calendar nav
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  // Slots for selected date
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Details form
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    service: "", notes: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load booking config on mount
  useEffect(() => {
    fetch("/api/book")
      .then(r => r.json())
      .then(d => {
        if (d.config) {
          if (Array.isArray(d.config.workingDays)) setWorkingDays(d.config.workingDays)
          if (typeof d.config.slotMinutes === "number") setSlotMinutes(d.config.slotMinutes)
        }
      })
      .catch(() => {})
  }, [])

  // Load slots when a date is selected
  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true)
    setSlots([])
    try {
      const res = await fetch(`/api/book/slots?date=${date}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch { /* ignore */ }
    setLoadingSlots(false)
  }, [])

  function pickDate(dateStr: string) {
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setStep("time")
    loadSlots(dateStr)
  }

  function pickSlot(slot: Slot) {
    setSelectedSlot(slot)
    setStep("details")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          starts_at: selectedSlot.starts_at,
          ends_at: selectedSlot.ends_at,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStep("done")
      } else {
        setError(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar grid for the current month
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startPad = firstDay.getDay()
  const todayStr = toDateStr(today)

  const calendarDays: { date: Date; dateStr: string; inMonth: boolean; isToday: boolean; isPast: boolean; isWorkDay: boolean }[] = []
  for (let i = -startPad; i < 42 - startPad; i++) {
    const d = new Date(viewYear, viewMonth, 1 + i)
    const dateStr = toDateStr(d)
    calendarDays.push({
      date: d,
      dateStr,
      inMonth: d.getMonth() === viewMonth,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isWorkDay: workingDays.includes(d.getDay()),
    })
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth()

  // Formatted selection for header
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : null
  const selectedLabel = selectedDateObj
    ? selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : ""

  return (
    <>
      {/* Thin hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Clock className="h-8 w-8 mx-auto mb-3 opacity-80" />
          <h1 className="text-3xl font-bold">Book an Appointment</h1>
          <p className="mt-2 text-white/70 text-lg">
            {slotMinutes} min · Select a date &amp; time
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" data-testid="book-widget">

            {/* ==================== STEP: DATE ==================== */}
            {step === "date" && (
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--site-primary)" }}>
                  Select a Date
                </h2>

                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} disabled={!canGoPrev}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30" data-testid="cal-prev">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-semibold text-lg">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                  <button onClick={nextMonth}
                    className="p-2 rounded-full hover:bg-gray-100" data-testid="cal-next">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_HEADERS.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ dateStr, inMonth, isToday, isPast, isWorkDay }, i) => {
                    const disabled = !inMonth || isPast || !isWorkDay
                    const selected = dateStr === selectedDate
                    return (
                      <button
                        key={i}
                        data-testid={`cal-day-${dateStr}`}
                        disabled={disabled}
                        onClick={() => pickDate(dateStr)}
                        className={[
                          "relative h-10 sm:h-12 rounded-lg text-sm font-medium transition-all",
                          disabled ? "text-gray-300 cursor-default" : "hover:bg-gray-100 cursor-pointer",
                          selected ? "ring-2 ring-offset-1" : "",
                          isToday && !selected ? "font-bold" : "",
                          inMonth && !isPast && isWorkDay ? "text-gray-900" : "",
                        ].join(" ")}
                        style={selected ? { background: "var(--site-primary)", color: "#fff", borderColor: "var(--site-primary)" } : undefined}
                      >
                        {inMonth ? new Date(dateStr + "T12:00:00").getDate() : ""}
                        {isToday && inMonth && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ background: selected ? "#fff" : "var(--site-primary)" }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ==================== STEP: TIME ==================== */}
            {step === "time" && (
              <div className="p-6 sm:p-8">
                <button onClick={() => setStep("date")} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4" data-testid="back-to-date">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--site-primary)" }}>
                  {selectedLabel}
                </h2>
                <p className="text-sm text-gray-500 mb-5">Pick a time slot ({slotMinutes} min each)</p>

                {loadingSlots ? (
                  <div className="py-10 text-center text-gray-400 text-sm">Loading available times…</div>
                ) : slots.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-500 font-medium">No availability</p>
                    <p className="text-sm text-gray-400 mt-1">All slots are booked or blocked. Try another date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map(slot => {
                      const active = selectedSlot?.starts_at === slot.starts_at
                      return (
                        <button
                          key={slot.starts_at}
                          data-testid={`slot-${slot.label}`}
                          onClick={() => pickSlot(slot)}
                          className={[
                            "py-3 px-2 rounded-lg text-sm font-medium border transition-all",
                            active
                              ? "text-white border-transparent shadow-md"
                              : "border-gray-200 text-gray-700 hover:border-gray-400",
                          ].join(" ")}
                          style={active ? { background: "var(--site-primary)" } : undefined}
                        >
                          {slot.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== STEP: DETAILS ==================== */}
            {step === "details" && selectedSlot && (
              <div className="p-6 sm:p-8">
                <button onClick={() => setStep("time")} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4" data-testid="back-to-time">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {/* Selection summary */}
                <div className="rounded-lg p-4 mb-6" style={{ background: "var(--site-primary)", color: "#fff" }}>
                  <p className="font-semibold">{selectedLabel}</p>
                  <p className="text-sm opacity-80">
                    {selectedSlot.label} · {slotMinutes} min
                  </p>
                </div>

                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--site-primary)" }}>
                  Enter your details
                </h2>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Name *">
                      <input data-testid="book-name" required value={form.customer_name}
                        onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                        className={inputCls} placeholder="Jane Doe" />
                    </Field>
                    <Field label="Email *">
                      <input data-testid="book-email" type="email" required value={form.customer_email}
                        onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                        className={inputCls} placeholder="jane@example.com" />
                    </Field>
                    <Field label="Phone">
                      <input data-testid="book-phone" value={form.customer_phone}
                        onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                        className={inputCls} placeholder="Optional" />
                    </Field>
                    <Field label="Service / reason">
                      <input data-testid="book-service" value={form.service}
                        onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                        className={inputCls} placeholder="What's this about?" />
                    </Field>
                  </div>
                  <Field label="Additional notes">
                    <textarea data-testid="book-notes" rows={3} value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className={inputCls} placeholder="Anything we should know? (optional)" />
                  </Field>

                  {error && <p className="text-sm text-red-600" data-testid="book-error">{error}</p>}

                  <button
                    type="submit"
                    data-testid="book-submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60 transition-opacity"
                    style={{ background: "var(--site-primary)" }}
                  >
                    {submitting ? "Scheduling…" : "Schedule appointment"}
                  </button>
                </form>
              </div>
            )}

            {/* ==================== STEP: DONE ==================== */}
            {step === "done" && (
              <div className="p-10 sm:p-14 text-center" data-testid="book-success">
                <CheckCircle2 className="h-14 w-14 mx-auto mb-5" style={{ color: "var(--site-accent, var(--site-primary))" }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--site-primary)" }}>
                  You&apos;re all set!
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Thanks, {form.customer_name.split(" ")[0] || "there"}.
                  Your appointment on <strong>{selectedLabel}</strong> at <strong>{selectedSlot?.label}</strong> is
                  pending — we&apos;ll confirm it by email at {form.customer_email}.
                </p>
                <button
                  onClick={() => { setStep("date"); setSelectedDate(null); setSelectedSlot(null); setForm({ customer_name: "", customer_email: "", customer_phone: "", service: "", notes: "" }) }}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  data-testid="book-another"
                >
                  Book another appointment
                </button>
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  )
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--site-primary)]/30"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  )
}
