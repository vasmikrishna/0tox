import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { AdminEmployeeActions } from "./actions"
import type { User } from "@/types"
import Link from "next/link"

export default async function AdminEmployeesPage() {
  let employees: User[] = []

  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseConfigured) {
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from("users")
        .select("id, email, name, role, job_title, status, created_at")
        .eq("role", "employee")
        .order("created_at", { ascending: false })
      employees = data ?? []
    } catch {}
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">{employees.length} employee{employees.length === 1 ? "" : "s"}</p>
        </div>
        <AdminEmployeeActions />
      </div>

      {!employees.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No employees yet. Invite one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All employees</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {employees.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/admin/employees/${emp.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{emp.name}</p>
                      {emp.status === "inactive" && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.25">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                    {emp.job_title && (
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">{emp.job_title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Joined {formatDate(emp.created_at)}</span>
                    <Badge variant="default">Employee</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
