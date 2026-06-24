import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutGrid } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function ClientProfilePage() {
  const session = await getSession()

  let phone: string | null = null
  let memberSince: string | null = null
  if (session?.id) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data } = await supabase.from("users").select("phone, created_at").eq("id", session.id).maybeSingle()
      phone = (data as { phone?: string | null } | null)?.phone ?? null
      memberSince = (data as { created_at?: string } | null)?.created_at ?? null
    } catch { /* show what we have from the session */ }
  }

  const rows: { label: string; value: string }[] = [
    { label: "Name", value: session?.name || "—" },
    { label: "Email", value: session?.email || "—" },
    { label: "Account type", value: session?.role ? session.role[0].toUpperCase() + session.role.slice(1) : "—" },
    ...(phone ? [{ label: "Phone", value: phone }] : []),
    ...(memberSince ? [{ label: "Member since", value: formatDate(memberSince) }] : []),
  ]

  return (
    <div className="space-y-8" data-testid="client-profile">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account details for this business</p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className="text-sm font-medium">{r.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <p className="font-semibold">All your businesses</p>
            <p className="text-sm text-muted-foreground">Switch between every business you belong to.</p>
          </div>
          <Link
            href="/account"
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            data-testid="profile-hub-link"
          >
            <LayoutGrid className="h-4 w-4" /> My businesses
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
