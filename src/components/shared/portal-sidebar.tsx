"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, FolderKanban, Plus, Users,
  CreditCard, Image, Sliders, LogOut, ChevronRight
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
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
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Portfolio", href: "/admin/portfolio", icon: Image },
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="text-xl font-bold tracking-tight">0→X</Link>
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
              {item.label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
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
