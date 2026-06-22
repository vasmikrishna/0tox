import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import { getBookingConfig, type BookingConfig } from "@/lib/booking-config"

function generateSlots(dateStr: string, config: BookingConfig) {
  const slots: { starts_at: string; ends_at: string; label: string }[] = []
  const base = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(base.getTime())) return slots

  const dayOfWeek = base.getDay()
  if (!config.workingDays.includes(dayOfWeek)) return slots

  const nowMs = Date.now()

  for (let h = config.startHour; h < config.endHour; ) {
    const slotStart = new Date(base)
    const wholeHour = Math.floor(h)
    const mins = Math.round((h - wholeHour) * 60)
    slotStart.setHours(wholeHour, mins, 0, 0)

    const slotEnd = new Date(slotStart.getTime() + config.slotMinutes * 60_000)

    if (slotEnd.getHours() > config.endHour || (slotEnd.getHours() === config.endHour && slotEnd.getMinutes() > 0)) {
      break
    }

    if (slotStart.getTime() > nowMs) {
      const label = slotStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      slots.push({
        starts_at: slotStart.toISOString(),
        ends_at: slotEnd.toISOString(),
        label,
      })
    }

    h += (config.slotMinutes + config.bufferMinutes) / 60
  }

  return slots
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date param required (YYYY-MM-DD)" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return NextResponse.json({ slots: [], config: { slotMinutes: 60 } })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)
  const config = getBookingConfig(tenant?.settings)

  const allSlots = generateSlots(date, config)
  if (allSlots.length === 0) {
    return NextResponse.json({ slots: [], config: { slotMinutes: config.slotMinutes } })
  }

  const dayStart = `${date}T00:00:00`
  const dayEnd = `${date}T23:59:59`

  const blocksQ = supabase
    .from("calendar_blocks")
    .select("starts_at, ends_at")
    .lt("starts_at", dayEnd)
    .gt("ends_at", dayStart)
  if (tenant?.id) blocksQ.eq("tenant_id", tenant.id)

  const busyQ = supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", dayEnd)
    .gt("ends_at", dayStart)
  if (tenant?.id) busyQ.eq("tenant_id", tenant.id)

  const [{ data: blocks }, { data: busy }] = await Promise.all([blocksQ, busyQ])

  const occupied = [...(blocks ?? []), ...(busy ?? [])].map(r => ({
    starts_at: r.starts_at as string,
    ends_at: r.ends_at as string,
  }))

  const available = allSlots.filter(
    slot => !occupied.some(o => overlaps(slot.starts_at, slot.ends_at, o.starts_at, o.ends_at))
  )

  return NextResponse.json({ slots: available, config: { slotMinutes: config.slotMinutes } })
}
