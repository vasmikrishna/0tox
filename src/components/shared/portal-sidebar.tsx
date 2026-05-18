"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, FolderKanban, Plus, Users,
  CreditCard, Image, Sliders, Globe, Mail, LogOut, ChevronRight
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badgeKey?: "enquiries"
}

const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { label: "My Projects", href: "/client/projects", icon: FolderKanban },
  { label: "New Project", href: "/client/projects/new", icon: Plus },
]

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Enquiries", href: "/admin/enquiries", icon: Mail, badgeKey: "enquiries" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Portfolio", href: "/admin/portfolio", icon: Image },
  { label: "Website", href: "/admin/website", icon: Globe },
  { label: "Config", href: "/admin/config/intake", icon: Sliders },
]

interface PortalSidebarProps {
  role: "client" | "admin"
  userName: string
  userEmail: string
}

export function PortalSidebar({ role, userName, userEmail }: PortalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = role === "admin" ? adminNav : clientNav
  const [newEnquiries, setNewEnquiries] = useState(0)

  useEffect(() => {
    if (role !== "admin") return
    let cancelled = false
    async function poll() {
      try {
        const res = await fetch("/api/admin/enquiries?status=new")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setNewEnquiries(data.counts?.new ?? 0)
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 60_000) // refresh every minute
    return () => { cancelled = true; clearInterval(id) }
  }, [role, pathname])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="text-xl font-bold tracking-tight">NexoIT</Link>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{role} portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== "/client/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badgeKey === "enquiries" && newEnquiries > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                  {newEnquiries}
                </span>
              )}
              {active && <ChevronRight className="h-3 w-3" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-3 w-3" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
