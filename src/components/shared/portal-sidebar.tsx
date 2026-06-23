"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { FEATURES } from "@/lib/features"
import {
  LayoutDashboard, FolderKanban, Plus, Users,
  CreditCard, Image, Sliders, Mail, LogOut, ChevronRight, UserCheck, ClipboardList,
  Building2, ChevronsUpDown, Check, Package, ShoppingCart, LayoutTemplate, CalendarClock, Globe
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
  { label: "Employees", href: "/admin/employees", icon: UserCheck },
  { label: "Enquiries", href: "/admin/enquiries", icon: Mail, badgeKey: "enquiries" },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarClock },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Surveys", href: "/admin/surveys", icon: ClipboardList },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Pages", href: "/admin/pages", icon: LayoutTemplate },
  { label: "Portfolio", href: "/admin/portfolio", icon: Image },
  { label: "Domain", href: "/admin/config/domain", icon: Globe },
  { label: "Config", href: "/admin/config/intake", icon: Sliders },
]

const employeeNav: NavItem[] = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "My Projects", href: "/employee/projects", icon: FolderKanban },
]

interface Workspace {
  tenantId: string
  name: string
  slug: string
  primary_color: string
  role: string
  active: boolean
}

interface PortalSidebarProps {
  role: "client" | "admin" | "employee"
  userName: string
  userEmail: string
}

export function PortalSidebar({ role, userName, userEmail }: PortalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const hiddenHrefs: string[] = [
    ...(FEATURES.ecommerce ? [] : ["/admin/products", "/admin/orders"]),
    ...(FEATURES.pageBuilder ? [] : ["/admin/pages"]),
    ...(FEATURES.bookings ? [] : ["/admin/bookings"]),
  ]
  const nav = (role === "admin" ? adminNav : role === "employee" ? employeeNav : clientNav)
    .filter((item) => !hiddenHrefs.includes(item.href))
  const [newEnquiries, setNewEnquiries] = useState(0)

  // Workspace switcher
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [showWsSwitcher, setShowWsSwitcher] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const activeWs = workspaces.find(w => w.active)

  useEffect(() => {
    fetch("/api/auth/workspaces")
      .then(r => r.json())
      .then(d => { if (d.workspaces?.length > 1) setWorkspaces(d.workspaces) })
      .catch(() => {})
  }, [])

  async function switchWorkspace(tenantId: string) {
    setSwitching(tenantId)
    const res = await fetch("/api/auth/switch-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    })
    const data = await res.json()
    setSwitching(null)
    setShowWsSwitcher(false)
    if (res.ok) {
      if (data.role === "admin") router.push("/admin/dashboard")
      else if (data.role === "employee") router.push("/employee/dashboard")
      else router.push("/client/dashboard")
      router.refresh()
    }
  }

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
    const id = setInterval(poll, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [role, pathname])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border h-screen sticky top-0 flex flex-col">

      {/* Workspace switcher (only shown when user has multiple workspaces) */}
      {workspaces.length > 1 ? (
        <div className="relative border-b border-border">
          <button
            onClick={() => setShowWsSwitcher(p => !p)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: activeWs?.primary_color ?? "#6366f1" }}>
              {(activeWs?.name ?? "W")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{activeWs?.name ?? "Workspace"}</p>
              <p className="text-xs text-muted-foreground">Site9</p>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>

          {showWsSwitcher && (
            <div className="absolute top-full left-0 right-0 z-20 bg-background border border-border rounded-b-xl shadow-lg overflow-hidden">
              <p className="px-3 pt-2 pb-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Your workspaces</p>
              {workspaces.map(ws => (
                <button
                  key={ws.tenantId}
                  onClick={() => switchWorkspace(ws.tenantId)}
                  disabled={ws.active || switching !== null}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left disabled:opacity-60"
                >
                  <div className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: ws.primary_color }}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ws.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{ws.role}</p>
                  </div>
                  {ws.active
                    ? <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : switching === ws.tenantId
                      ? <div className="h-3.5 w-3.5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin shrink-0" />
                      : null
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 border-b border-border">
          <Link href="/" className="text-xl font-bold tracking-tight">Site9</Link>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{role} portal</p>
        </div>
      )}

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
