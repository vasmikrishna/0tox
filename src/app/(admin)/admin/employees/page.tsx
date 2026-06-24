import { Card, CardContent } from "@/components/ui/card"
import { AdminEmployeeActions } from "./actions"
import type { User } from "@/types"
import { EmployeesList } from "./employees-list"

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
        <EmployeesList employees={employees} />
      )}
    </div>
  )
}
