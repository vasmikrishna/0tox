import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { PortalSidebar } from "@/components/shared/portal-sidebar"
import { UpgradeBanner } from "@/components/build/upgrade-banner"
import { getSubscriptionStatus } from "@/lib/subscription"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "admin") redirect("/client/dashboard")

  // Super-admin (env login, id="admin") has no tenant — skip the upsell for them.
  const subscribed =
    session.tenant_id && session.id !== "admin"
      ? (await getSubscriptionStatus(session.tenant_id)).active
      : true

  return (
    <div className="flex min-h-screen">
      <PortalSidebar role="admin" userName={session.name} userEmail={session.email} />
      <main className="flex-1 overflow-auto">
        <UpgradeBanner subscribed={subscribed} />
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
