import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { PortalSidebar } from "@/components/shared/portal-sidebar"

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-screen">
      <PortalSidebar role="client" userName={session.name} userEmail={session.email} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
