import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { PortalSidebar } from "@/components/shared/portal-sidebar"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "employee") redirect("/login")

  return (
    <div className="flex min-h-screen">
      <PortalSidebar role="employee" userName={session.name} userEmail={session.email} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
