"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, ChevronDown, Lock, ChevronRight, Eye, EyeOff } from "lucide-react"

interface Workspace {
  userId: string
  tenantId: string
  role: string
  name: string
  slug: string
  primary_color: string
  industry: string
}

function getSubdomainSlug(): string | null {
  if (typeof window === "undefined") return null
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return null
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"
  if (host.endsWith(`.${baseDomain}`)) return host.slice(0, host.length - baseDomain.length - 1) || null
  if (host.endsWith(".localhost")) return host.slice(0, host.lastIndexOf(".localhost")) || null
  return null
}

function getDevTenantCookie() {
  if (typeof document === "undefined") return "0tox"
  const match = document.cookie.match(/(?:^|;\s*)dev_tenant=([^;]+)/)
  return match?.[1] ?? "0tox"
}

function dashboardFor(role: string, onboardingComplete?: boolean, superadmin?: boolean) {
  if (superadmin) return "/superadmin"
  if (onboardingComplete === false) return "/build"
  if (role === "admin") return "/admin/dashboard"
  if (role === "employee") return "/employee/dashboard"
  return "/client/dashboard"
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Workspace picker (shown after login when user belongs to multiple tenants)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [pickingWorkspace, setPickingWorkspace] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  // Tenant bar
  const [subdomainSlug, setSubdomainSlug] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState("")
  const [allTenants, setAllTenants] = useState<{ id: string; name: string; slug: string }[]>([])
  const [activeTenant, setActiveTenant] = useState("0tox")
  const [switchingTenant, setSwitchingTenant] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [tenantReady, setTenantReady] = useState(false)

  const IS_DEV = process.env.NODE_ENV !== "production"

  useEffect(() => {
    const slug = getSubdomainSlug()
    setSubdomainSlug(slug)

    fetch("/api/superadmin/tenants")
      .then(r => r.json())
      .then(d => {
        const list = d.tenants ?? []
        setAllTenants(list)
        if (slug) {
          const t = list.find((t: { id: string; name: string; slug: string }) => t.slug === slug)
          setTenantName(t?.name ?? slug)
        } else if (IS_DEV) {
          const cookie = getDevTenantCookie()
          setActiveTenant(cookie)
          const t = list.find((t: { id: string; name: string; slug: string }) => t.slug === cookie)
          setTenantName(t?.name ?? cookie)
        }
        setTenantReady(true)
      })
      .catch(() => setTenantReady(true))
  }, [IS_DEV])

  async function switchDevTenant(slug: string) {
    setSwitchingTenant(true)
    await fetch("/api/dev/switch-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
    const t = allTenants.find(t => t.slug === slug)
    setActiveTenant(slug)
    setTenantName(t?.name ?? slug)
    setSwitchingTenant(false)
    setShowPicker(false)
    setError("")
  }

  // Send the user into their workspace after a successful login. When the slug
  // belongs to a different subdomain than the one we're on (e.g. signing in on
  // the main site9.in), hand off to that subdomain so the session cookie — which
  // is scoped to .site9.in — lands the owner on their own site.
  async function goToWorkspace(data: { role: string; onboarding_complete?: boolean; superadmin?: boolean; slug?: string }) {
    const dash = dashboardFor(data.role, data.onboarding_complete, data.superadmin)
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"
    const currentSlug = getSubdomainSlug()

    if (data.slug && data.slug !== currentSlug) {
      if (process.env.NODE_ENV === "production") {
        window.location.href = `https://${data.slug}.${baseDomain}${dash}`
        return
      }
      // Dev has no real subdomains: align the dev tenant cookie, then navigate.
      await fetch("/api/dev/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: data.slug }),
      }).catch(() => {})
    }
    router.push(dash)
    router.refresh()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    // phone is captured in the form but the current backend login flow is
    // email + password only. We include it in the payload so that a future
    // backend update can consume it without any frontend changes; the API
    // silently ignores unknown fields today.
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...(phone ? { phone } : {}) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Invalid credentials"); return }

    if (data.choose) {
      // User belongs to multiple workspaces — show picker
      setWorkspaces(data.workspaces)
      setPickingWorkspace(true)
      return
    }

    await goToWorkspace(data)
  }

  async function selectWorkspace(ws: Workspace) {
    setSwitchingId(ws.tenantId)
    const res = await fetch("/api/auth/select-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, tenantId: ws.tenantId }),
    })
    const data = await res.json()
    setSwitchingId(null)
    if (!res.ok) { setError(data.error ?? "Failed to switch"); return }
    await goToWorkspace(data)
  }

  const showTenantBar = tenantReady && !pickingWorkspace && (subdomainSlug || (IS_DEV && allTenants.length > 0))
  const displaySlug = subdomainSlug ?? activeTenant

  // ── Workspace picker screen ──────────────────────────────────────────────
  if (pickingWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1 mb-6">
            <Link href="/" className="text-2xl font-bold tracking-tight">0toX</Link>
            <p className="text-muted-foreground text-sm">Choose a workspace to continue</p>
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="space-y-2">
            {workspaces.map(ws => (
              <button
                key={ws.tenantId}
                onClick={() => selectWorkspace(ws)}
                disabled={switchingId !== null}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-foreground/30 hover:bg-accent transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0"
                  style={{ backgroundColor: ws.primary_color }}>
                  {ws.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{ws.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{ws.slug}.site9.in · <span className="capitalize">{ws.role}</span></p>
                </div>
                {switchingId === ws.tenantId
                  ? <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                }
              </button>
            ))}
          </div>

          <button
            onClick={() => { setPickingWorkspace(false); setError("") }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
          >
            ← Back to login
          </button>
        </div>
      </div>
    )
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Tenant bar */}
        {showTenantBar && (
          subdomainSlug ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs">Signing into</span>
              <span className="font-semibold">{tenantName}</span>
              <span className="text-xs text-muted-foreground font-mono ml-auto">{subdomainSlug}.site9.in</span>
              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowPicker(p => !p)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs shrink-0">Tenant:</span>
                  <span className="font-medium truncate">{tenantName || activeTenant}</span>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">({displaySlug}.site9.in)</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
              {showPicker && (
                <div className="absolute top-full mt-1 left-0 right-0 z-10 rounded-lg border bg-background shadow-lg overflow-hidden">
                  {allTenants.map(t => (
                    <button key={t.id} onClick={() => switchDevTenant(t.slug)} disabled={switchingTenant}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{t.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        <div className="text-center space-y-1">
          <Link href="/" className="text-2xl font-bold tracking-tight">0toX</Link>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <a href="/api/auth/google" className="flex items-center justify-center gap-3 w-full border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                data-testid="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                data-testid="login-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone number <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Input
              id="phone"
              data-testid="login-phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" variant="brand" loading={loading} data-testid="login-submit">Sign in</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
