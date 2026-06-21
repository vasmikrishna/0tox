import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { EmployeeDetailsClient } from "./details-client"
import type { User } from "@/types"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/login")

  const { id } = await params
  let employee: User | null = null
  let assignments: any[] = []

  if (supabaseConfigured()) {
    try {
      const supabase = createClient()
      
      // Fetch employee profile details
      const { data: dbUser } = await (supabase as any)
        .from("users")
        .select("id, email, name, avatar_url, role, job_title, phone, bio, status, created_at")
        .eq("id", id)
        .eq("role", "employee")
        .single()

      if (dbUser) {
        employee = dbUser as User
        
        // Fetch active project assignments
        const { data: dbAssigns } = await (supabase as any)
          .from("project_assignments")
          .select("id, project_id, employee_id, projects(id, title, status)")
          .eq("employee_id", id)
        assignments = dbAssigns ?? []
      }
    } catch {}
  }

  if (!employee) notFound()

  return (
    <EmployeeDetailsClient
      initialEmployee={employee}
      initialAssignments={assignments}
    />
  )
}
