"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Copy, Check } from "lucide-react"

export function AdminEmployeeActions() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!form.name || !form.email) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? "Failed to create employee"); return }
    setCreated({ email: data.employee.email, tempPassword: data.tempPassword })
    router.refresh()
  }

  function copyPassword() {
    if (created) navigator.clipboard.writeText(created.tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function close() {
    setOpen(false)
    setForm({ name: "", email: "" })
    setError("")
    setCreated(null)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> Invite employee
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 space-y-4">
              {created ? (
                <>
                  <h2 className="text-lg font-semibold">Employee created</h2>
                  <p className="text-sm text-muted-foreground">
                    Share these credentials with <strong>{created.email}</strong>. They should change their password after first login.
                  </p>
                  <div className="rounded-lg border border-border bg-muted p-4 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Email:</span> {created.email}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p><span className="text-muted-foreground">Password:</span> <code className="bg-background px-1.5 py-0.5 rounded border border-border">{created.tempPassword}</code></p>
                      <button onClick={copyPassword} className="text-muted-foreground hover:text-foreground">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={close}>Done</Button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">Invite employee</h2>
                  <Input
                    placeholder="Full name"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleCreate} disabled={saving || !form.name || !form.email}>
                      {saving ? "Creating…" : "Create account"}
                    </Button>
                    <Button variant="ghost" onClick={close}>Cancel</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
