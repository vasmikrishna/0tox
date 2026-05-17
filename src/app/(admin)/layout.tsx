import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { PortalSidebar } from "@/components/shared/portal-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "admin") redirect("/client/dashboard")

  return (
    <div className="flex min-h-screen">
      <PortalSidebar role="admin" userName={session.name} userEmail={session.email} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
