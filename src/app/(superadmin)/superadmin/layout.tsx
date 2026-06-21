import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Link from "next/link"
import { LayoutDashboard, Building2, LogOut } from "lucide-react"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"
  if (!session || session.email !== SUPER_ADMIN_EMAIL) redirect("/login")

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="w-56 shrink-0 border-r bg-background flex flex-col">
        <div className="px-5 py-4 border-b">
          <p className="font-bold text-lg">0toX</p>
          <p className="text-xs text-muted-foreground">Super Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/superadmin" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/superadmin/tenants" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <Building2 className="h-4 w-4" /> Tenants
          </Link>
        </nav>
        <div className="px-3 py-4 border-t">
          <form action="/api/auth/logout" method="POST">
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
