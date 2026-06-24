import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock } from "lucide-react"
import { getSession } from "@/lib/session"
import type { Booking } from "@/types"

const statusVariant: Record<string, "default" | "warning" | "brand" | "success" | "destructive"> = {
  pending: "warning",
  confirmed: "brand",
  completed: "success",
  cancelled: "destructive",
}

function formatSlot(starts: string, ends: string): string {
  const s = new Date(starts)
  const e = new Date(ends)
  const date = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${date} · ${t(s)} – ${t(e)}`
}

export const dynamic = "force-dynamic"

export default async function ClientBookingsPage() {
  const session = await getSession()
  let bookings: Booking[] = []

  // Bookings are keyed by the customer's email (they can be made by guests), so we
  // match on email within the current tenant. A logged-in customer sees the
  // bookings they made with this business.
  if (session?.email && session.tenant_id) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("tenant_id", session.tenant_id)
        .eq("customer_email", session.email)
        .order("starts_at", { ascending: false })
      bookings = (data as Booking[] | null) ?? []
    } catch { /* fall through to empty state */ }
  }

  return (
    <div className="space-y-8" data-testid="client-bookings">
      <div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="mt-1 text-muted-foreground">Your appointments with this business</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="transition-colors hover:border-foreground/20">
              <CardContent className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="font-medium">{b.service || "Appointment"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatSlot(b.starts_at, b.ends_at)}</p>
                </div>
                <Badge variant={statusVariant[b.status] ?? "default"}>{b.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
