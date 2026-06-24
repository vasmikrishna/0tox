"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, LogOut, Store, Crown, Briefcase } from "lucide-react"
import type { Workspace } from "@/lib/workspaces"

interface AccountHubProps {
  userName: string
  userEmail: string
  workspaces: Workspace[]
  baseDomain: string
}

function dashboardPath(role: Workspace["role"]): string {
  if (role === "admin") return "/admin/dashboard"
  if (role === "employee") return "/employee/dashboard"
  return "/client/dashboard"
}

function BusinessSection({ title, hint, icon: Icon, items, busy, onEnter }: {
  title: string
  hint: string
  icon: React.ElementType
  items: Workspace[]
  busy: string | null
  onEnter: (ws: Workspace) => void
}) {
  if (items.length === 0) return null
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground/70">· {hint}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((ws) => (
          <div
            key={ws.tenantId}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            data-testid={`business-card-${ws.slug || ws.tenantId}`}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
              style={{ backgroundColor: ws.primary_color }}
            >
              {(ws.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{ws.name}</p>
                {ws.active && (
                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                    Current
                  </span>
                )}
              </div>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {ws.role}{ws.industry ? ` · ${ws.industry}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnter(ws)}
              disabled={busy !== null}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              data-testid={`enter-business-${ws.slug || ws.tenantId}`}
            >
              {busy === ws.tenantId ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
              ) : (
                <>Enter <ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AccountHub({ userName, userEmail, workspaces, baseDomain }: AccountHubProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const owned = workspaces.filter((w) => w.role === "admin")
  const customerOf = workspaces.filter((w) => w.role === "client")
  const workWith = workspaces.filter((w) => w.role === "employee")

  // Build the absolute URL of a business on its own subdomain. The session cookie
  // is shared across *.site9.in, so a full navigation there stays authenticated.
  function businessUrl(slug: string, path: string): string {
    const { protocol, hostname, port } = window.location
    const isLocal = hostname === "localhost" || hostname.endsWith(".localhost")
    const domain = isLocal ? "localhost" : baseDomain
    const portPart = port ? `:${port}` : ""
    return `${protocol}//${slug}.${domain}${portPart}${path}`
  }

  async function enter(ws: Workspace) {
    setBusy(ws.tenantId)
    setError("")
    try {
      // Point the session at this tenant, then land on its subdomain so the
      // middleware's tenant-isolation check passes.
      const res = await fetch("/api/auth/switch-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: ws.tenantId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not open that business")
        setBusy(null)
        return
      }
      window.location.assign(businessUrl(ws.slug, dashboardPath(data.role ?? ws.role)))
    } catch {
      setError("Could not open that business")
      setBusy(null)
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch { /* ignore */ }
    window.location.assign("/")
  }

  const hasAny = workspaces.length > 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight" data-testid="account-hub-logo">
            Site<span className="text-brand">9</span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
            data-testid="account-hub-signout"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6" data-testid="account-hub">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {userName.split(" ")[0] || "there"}</h1>
          <p className="mt-1 text-muted-foreground">{userEmail}</p>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {hasAny ? (
          <div className="space-y-8">
            <BusinessSection title="Businesses you own" hint="sites you manage" icon={Crown} items={owned} busy={busy} onEnter={enter} />
            <BusinessSection title="You're a customer of" hint="businesses you've signed up with" icon={Store} items={customerOf} busy={busy} onEnter={enter} />
            <BusinessSection title="Businesses you work with" hint="as a team member" icon={Briefcase} items={workWith} busy={busy} onEnter={enter} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <p>You don&apos;t belong to any businesses yet.</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Start your own website</p>
              <p className="text-sm text-muted-foreground">Build a Site9 site for your business in minutes.</p>
            </div>
            <Link
              href="/start"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              data-testid="account-hub-create"
            >
              <Plus className="h-4 w-4" /> Create a new website
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
