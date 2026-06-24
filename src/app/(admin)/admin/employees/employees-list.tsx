"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { User } from "@/types"
import Link from "next/link"
import { PaginatedList } from "@/components/paginated-list"

export function EmployeesList({ employees }: { employees: User[] }) {
  return (
    <PaginatedList
      items={employees}
      pageSize={10}
      searchPlaceholder="Search employees by name, email, job title, or status..."
      testId="employees"
      searchText={(emp) => `${emp.name} ${emp.email} ${emp.job_title ?? ""} ${emp.status}`}
    >
      {(pageEmployees) => (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All employees</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pageEmployees.map((emp) => (
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
    </PaginatedList>
  )
}
