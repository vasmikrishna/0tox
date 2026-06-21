"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Check, ExternalLink, Users, Trash2, Save, UserPlus, Eye, EyeOff } from "lucide-react"

const INDUSTRY_LABELS: Record<string, string> = {
  software: "Software / Tech", real_estate: "Real Estate", healthcare: "Healthcare",
  legal: "Legal / Law", marketing: "Marketing / Creative", ecommerce: "E-commerce",
  education: "Education", hospitality: "Hospitality", finance: "Finance / Accounting",
  construction: "Construction", fitness: "Fitness / Wellness", consulting: "Consulting",
}

const PLANS = ["starter", "growth", "enterprise"]
const STATUSES = ["active", "trial", "suspended"]

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tenant, setTenant] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Create user form
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "admin" })
  const [showPassword, setShowPassword] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [userError, setUserError] = useState("")
  const [userSuccess, setUserSuccess] = useState("")

  useEffect(() => {
    fetch(`/api/superadmin/tenants/${id}`)
      .then(r => r.json())
      .then(d => { setTenant(d.tenant); setUsers(d.users ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function save() {
    setSaving(true); setError(""); setSuccess("")
    const res = await fetch(`/api/superadmin/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tenant),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error ?? "Failed to save"); return }
    setTenant(d.tenant)
    setSuccess("Saved!")
    setTimeout(() => setSuccess(""), 2500)
  }

  async function deleteTenant() {
    if (!confirm(`Permanently delete "${tenant?.name}" and all their data? This cannot be undone.`)) return
    const res = await fetch(`/api/superadmin/tenants/${id}`, { method: "DELETE" })
    if (res.ok) router.push("/superadmin/tenants")
    else setError("Failed to delete")
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) { setUserError("All fields required"); return }
    if (newUser.password.length < 8) { setUserError("Password must be at least 8 characters"); return }
    setCreatingUser(true); setUserError(""); setUserSuccess("")
    const res = await fetch(`/api/superadmin/tenants/${id}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
    const d = await res.json()
    setCreatingUser(false)
    if (!res.ok) { setUserError(d.error ?? "Failed to create user"); return }
    setUsers(prev => [...prev, d.user])
    setUserSuccess(`User "${newUser.name}" created!`)
    setNewUser({ name: "", email: "", password: "", role: "admin" })
    setTimeout(() => setUserSuccess(""), 3000)
  }

  function copyUrl() {
    navigator.clipboard.writeText(`https://${tenant.slug}.0tox.com`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>
  if (!tenant) return <div className="text-destructive text-sm">Tenant not found.</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/tenants"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm font-mono">{tenant.slug}.0tox.com</p>
        </div>
      </div>

      {/* Portal link */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Portal URL</p>
            <p className="font-mono text-sm">{tenant.slug}.0tox.com</p>
            <p className="text-xs text-muted-foreground mt-0.5">Dev: <span className="font-mono">{tenant.slug}.localhost:3001</span></p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyUrl}>
              {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`http://${tenant.slug}.localhost:3001`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Open dev
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader><CardTitle>Tenant settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Company name</Label>
              <Input value={tenant.name} onChange={e => setTenant((t: any) => ({ ...t, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Subdomain slug</Label>
              <div className="flex items-center gap-2">
                <Input value={tenant.slug} onChange={e => setTenant((t: any) => ({ ...t, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} className="font-mono" />
                <span className="text-xs text-muted-foreground shrink-0">.0tox.com</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <select value={tenant.plan} onChange={e => setTenant((t: any) => ({ ...t, plan: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {PLANS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={tenant.status} onChange={e => setTenant((t: any) => ({ ...t, status: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input type="email" value={tenant.contact_email ?? ""} onChange={e => setTenant((t: any) => ({ ...t, contact_email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Brand colour</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={tenant.primary_color} onChange={e => setTenant((t: any) => ({ ...t, primary_color: e.target.value }))}
                  className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1" />
                <Input value={tenant.primary_color} onChange={e => setTenant((t: any) => ({ ...t, primary_color: e.target.value }))} className="font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Industry</Label>
            <p className="text-sm text-muted-foreground">{INDUSTRY_LABELS[tenant.industry] ?? tenant.industry} <span className="text-xs">(set at creation — cannot change)</span></p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="brand" loading={saving} onClick={save}><Save className="h-4 w-4" /> Save changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Create user */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create user for this tenant</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input placeholder="Jane Smith" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jane@company.com" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={newUser.password}
                  onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                  className="pr-9"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>
          {userError && <p className="text-sm text-destructive">{userError}</p>}
          {userSuccess && <p className="text-sm text-green-500">{userSuccess}</p>}
          <Button variant="brand" loading={creatingUser} onClick={createUser}>
            <UserPlus className="h-4 w-4" /> Create user
          </Button>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "admin" ? "default" : u.role === "employee" ? "warning" : "outline"}>
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive text-base">Danger zone</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete this tenant</p>
            <p className="text-xs text-muted-foreground">Permanently removes the tenant and all their data.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={deleteTenant}>
            <Trash2 className="h-4 w-4" /> Delete tenant
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
