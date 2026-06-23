import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getTenantById } from "@/lib/tenant"
import { PortalSidebar } from "@/components/shared/portal-sidebar"

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  // Self-serve owners can't reach the portal until they've published their site.
  if (session.tenant_id) {
    const tenant = await getTenantById(session.tenant_id)
    if (tenant && tenant.onboarding_complete === false) redirect("/build")
  }

  return (
    <div className="flex min-h-screen">
      <PortalSidebar role="client" userName={session.name} userEmail={session.email} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
