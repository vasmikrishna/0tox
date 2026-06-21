"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Check, ShieldAlert, ArrowLeft, Loader2, Save, Trash } from "lucide-react"
import Link from "next/link"
import type { User } from "@/types"

interface ProjectInfo {
  id: string
  title: string
  status: string
}

interface Assignment {
  id: string
  project_id: string
  employee_id: string
  projects?: ProjectInfo
}

interface DetailsClientProps {
  initialEmployee: User
  initialAssignments: Assignment[]
}

const statusLabels: Record<string, string> = {
  intake: "Submitted",
  review: "In Review",
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

const statusVariants: Record<string, "default" | "warning" | "brand" | "success" | "destructive"> = {
  intake: "default",
  review: "warning",
  active: "brand",
  completed: "success",
  cancelled: "destructive",
}

export function EmployeeDetailsClient({ initialEmployee, initialAssignments }: DetailsClientProps) {
  const router = useRouter()
  const [employee, setEmployee] = useState<User>(initialEmployee)
  const [assignments] = useState<Assignment[]>(initialAssignments)

  // Edit form states
  const [form, setForm] = useState({
    name: employee.name || "",
    email: employee.email || "",
    job_title: employee.job_title || "",
    phone: employee.phone || "",
    bio: employee.bio || "",
    status: employee.status || "active",
  })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Password reset states
  const [resetting, setResetting] = useState(false)
  const [tempPassword, setTempPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [resetError, setResetError] = useState("")

  // Delete states
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleUpdate() {
    setSaving(true)
    setEditError("")
    setSuccessMsg("")
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error ?? "Failed to update employee")
      } else {
        setEmployee(data.employee)
        setSuccessMsg("Profile updated successfully")
        router.refresh()
      }
    } catch {
      setEditError("Network error occurred")
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    setResetting(true)
    setResetError("")
    setTempPassword("")
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}/reset-password`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setResetError(data.error ?? "Failed to reset password")
      } else {
        setTempPassword(data.tempPassword)
      }
    } catch {
      setResetError("Network error occurred")
    } finally {
      setResetting(false)
    }
  }

  function copyPassword() {
    if (tempPassword) navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error ?? "Failed to delete employee")
        setDeleting(false)
        setConfirmDelete(false)
      } else {
        router.push("/admin/employees")
        router.refresh()
      }
    } catch {
      setEditError("Network error occurred")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href="/admin/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <Badge variant={employee.status === "inactive" ? "destructive" : "brand"}>
              {employee.status === "inactive" ? "Inactive" : "Active"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Employee profile management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — General Info & Editing */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
                  <Input
                    value={form.job_title}
                    onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
                    placeholder="e.g. Lead Designer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +61 400 000 000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Short Bio & Skills</label>
                <Textarea
                  rows={4}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Notes about skillsets, availability, or focus areas..."
                />
              </div>

              <div className="space-y-1 w-1/2">
                <label className="text-xs font-semibold text-muted-foreground">Account Status</label>
                <Select
                  value={form.status}
                  onValueChange={val => setForm(p => ({ ...p, status: val as "active" | "inactive" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editError && <p className="text-sm text-destructive">{editError}</p>}
              {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

              <div className="pt-2 flex justify-end">
                <Button onClick={handleUpdate} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Password Reset & Assignments */}
        <div className="space-y-6">
          {/* Security & Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Credentials & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to generate a new secure, random temporary password for this employee. A reset email will be sent if Resend is configured.
              </p>

              {tempPassword ? (
                <div className="rounded-lg border border-border bg-muted p-4 space-y-2 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">New Temporary Password</p>
                  <div className="flex items-center justify-between gap-2 bg-background px-3 py-2 rounded border border-border">
                    <code className="font-mono text-sm">{tempPassword}</code>
                    <button onClick={copyPassword} className="text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Please copy and share this password immediately. It will not be shown again.</p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/40"
                  onClick={handleResetPassword}
                  disabled={resetting}
                >
                  {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset account password
                </Button>
              )}

              {resetError && <p className="text-xs text-destructive">{resetError}</p>}
            </CardContent>
          </Card>

          {/* Active Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!assignments.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active projects assigned</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map(a => {
                    const p = a.projects
                    if (!p) return null
                    return (
                      <Link
                        key={a.id}
                        href={`/admin/projects/${p.id}`}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:border-foreground/20 hover:bg-muted/30 transition"
                      >
                        <span className="text-xs font-semibold truncate max-w-[150px]">{p.title}</span>
                        <Badge variant={statusVariants[p.status] ?? "default"} className="text-[9px] px-1.5 py-0">
                          {statusLabels[p.status] ?? p.status}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Employee */}
          <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-destructive-foreground/80 leading-relaxed">
                Deleting this account will permanently remove the employee profile and all project assignment linkages. This cannot be undone.
              </p>

              {confirmDelete ? (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Confirm delete"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash className="h-4 w-4" /> Delete employee account
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
