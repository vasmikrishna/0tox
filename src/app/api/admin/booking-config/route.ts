import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenant } from "@/lib/tenant"
import { getBookingConfig } from "@/lib/booking-config"

// GET — return current booking config for this tenant
export async function GET() {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tenant = await getCurrentTenant().catch(() => null)
  const config = getBookingConfig(tenant?.settings)
  return NextResponse.json({ config })
}

// PUT — save booking config into tenant settings.booking
export async function PUT(request: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const slotMinutes = typeof body.slotMinutes === "number" && body.slotMinutes > 0 ? body.slotMinutes : 60
  const startHour = typeof body.startHour === "number" ? Math.max(0, Math.min(23, body.startHour)) : 9
  const endHour = typeof body.endHour === "number" ? Math.max(1, Math.min(24, body.endHour)) : 18
  const workingDays = Array.isArray(body.workingDays) ? body.workingDays.filter((d: unknown) => typeof d === "number" && d >= 0 && d <= 6) : [1, 2, 3, 4, 5, 6]
  const bufferMinutes = typeof body.bufferMinutes === "number" ? Math.max(0, body.bufferMinutes) : 0

  if (endHour <= startHour) {
    return NextResponse.json({ error: "End hour must be after start hour" }, { status: 400 })
  }

  const supabase = createClient()
  const tenant = await getCurrentTenant().catch(() => null)
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  const existingSettings = (tenant.settings ?? {}) as Record<string, unknown>
  const newSettings = {
    ...existingSettings,
    booking: { slotMinutes, startHour, endHour, workingDays, bufferMinutes },
  }

  const { error } = await (supabase as never as ReturnType<typeof createClient>)
    .from("tenants")
    .update({ settings: newSettings } as never)
    .eq("id", tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ config: newSettings.booking })
}
