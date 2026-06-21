"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"

const INDUSTRIES = [
  { value: "software",     label: "Software / Tech" },
  { value: "real_estate",  label: "Real Estate" },
  { value: "healthcare",   label: "Healthcare / Medical" },
  { value: "legal",        label: "Legal / Law" },
  { value: "marketing",    label: "Marketing / Creative" },
  { value: "ecommerce",    label: "E-commerce" },
  { value: "education",    label: "Education" },
  { value: "hospitality",  label: "Hospitality" },
  { value: "finance",      label: "Finance / Accounting" },
  { value: "construction", label: "Construction / Architecture" },
  { value: "fitness",      label: "Fitness / Wellness" },
  { value: "consulting",   label: "Consulting" },
]

const PLANS = [
  { value: "starter",    label: "Starter" },
  { value: "growth",     label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
]

export default function NewTenantPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", slug: "", industry: "software", plan: "starter",
    contact_email: "", primary_color: "#1B3A6B",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  function set(key: string, val: string) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === "name" && !f.slug) {
        next.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)
      }
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.slug || !form.industry) { setError("Name, slug and industry are required"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/superadmin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Failed"); return }
    setResult(data)
  }

  if (result) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-green-500" />
          <h1 className="text-2xl font-bold">Tenant created!</h1>
        </div>
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div><p className="text-xs text-muted-foreground">Company name</p><p className="font-medium">{result.tenant.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Portal URL</p><p className="font-mono text-sm">{result.tenant.slug}.0tox.com</p></div>
            <div><p className="text-xs text-muted-foreground">Industry</p><p className="font-medium capitalize">{result.tenant.industry.replace("_", " ")}</p></div>
            <div><p className="text-xs text-muted-foreground">Auto-created</p>
              <ul className="text-sm mt-1 space-y-0.5">
                <li>✓ {result.seeded.packages} packages</li>
                <li>✓ {result.seeded.stages} project stages</li>
                <li>✓ {result.seeded.intake_questions} intake questions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="brand" asChild><Link href="/superadmin">Back to dashboard</Link></Button>
          <Button variant="outline" onClick={() => setResult(null)}>Create another</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">New Tenant</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Tenant details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Acme Digital" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Subdomain slug *</Label>
              <div className="flex items-center gap-2">
                <Input value={form.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="acme" className="font-mono" />
                <span className="text-sm text-muted-foreground shrink-0">.0tox.com</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Industry *</Label>
              <select value={form.industry} onChange={e => set("industry", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Auto-creates packages, project stages, and intake questions for this industry.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <select value={form.plan} onChange={e => set("plan", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contact email</Label>
                <Input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} placeholder="admin@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Brand colour</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primary_color} onChange={e => set("primary_color", e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1" />
                  <Input value={form.primary_color} onChange={e => set("primary_color", e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="brand" loading={loading} className="w-full">
              Create tenant &amp; seed industry config
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
