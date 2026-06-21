"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, X } from "lucide-react"
import type { User } from "@/types"

interface Assignment {
  id: string
  employee_id: string
  assigned_at: string
  users: Pick<User, "id" | "name" | "email">
}

export function AdminProjectAssignments({ projectId }: { projectId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}/assignments`)
      .then(r => r.json())
      .then(d => setAssignments(d.assignments ?? []))
      .catch(() => {})
  }, [projectId])

  async function openAssign() {
    if (!employees.length) {
      const res = await fetch("/api/admin/employees")
      const data = await res.json()
      setEmployees(data.employees ?? [])
    }
    setAdding(true)
  }

  async function assign() {
    if (!selectedId) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/admin/projects/${projectId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: selectedId }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? "Failed to assign"); return }
    const emp = employees.find(e => e.id === selectedId)
    if (emp) {
      setAssignments(prev => [...prev, { ...data.assignment, users: emp }])
    }
    setAdding(false)
    setSelectedId("")
  }

  async function unassign(employeeId: string) {
    await fetch(`/api/admin/projects/${projectId}/assignments/${employeeId}`, { method: "DELETE" })
    setAssignments(prev => prev.filter(a => a.employee_id !== employeeId))
  }

  const unassigned = employees.filter(e => !assignments.some(a => a.employee_id === e.id))

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Assigned employees</CardTitle>
        <Button size="sm" variant="outline" onClick={openAssign}>
          <UserPlus className="h-3 w-3" /> Assign
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {!assignments.length && !adding && (
          <p className="text-sm text-muted-foreground text-center py-2">No employees assigned</p>
        )}
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
            <div>
              <p className="text-sm font-medium">{a.users?.name}</p>
              <p className="text-xs text-muted-foreground">{a.users?.email}</p>
            </div>
            <button
              onClick={() => unassign(a.employee_id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {adding && (
          <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none"
            >
              <option value="">Select an employee…</option>
              {unassigned.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
              ))}
            </select>
            {!unassigned.length && <p className="text-xs text-muted-foreground">All employees are already assigned, or no employees exist.</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={assign} disabled={!selectedId || saving}>{saving ? "Assigning…" : "Assign"}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setSelectedId(""); setError("") }}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
