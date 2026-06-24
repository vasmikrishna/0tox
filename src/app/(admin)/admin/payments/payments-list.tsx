"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { PaginatedList } from "@/components/paginated-list"

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  pending: { label: "Pending",  variant: "warning" },
  paid:    { label: "Paid",     variant: "success" },
  overdue: { label: "Overdue",  variant: "destructive" },
}

const methodLabel: Record<string, string> = {
  stripe:        "Card (Stripe)",
  bank_transfer: "Bank transfer",
  other:         "Other",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PaymentsList({ payments }: { payments: any[] }) {
  return (
    <PaginatedList
      items={payments}
      pageSize={10}
      searchPlaceholder="Search payments by description, project, method, or status..."
      testId="payments"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchText={(p: any) => `${p.label} ${p.projects?.title ?? ""} ${methodLabel[p.method] ?? p.method} ${statusConfig[p.status]?.label ?? p.status}`}
    >
      {(pagePayments) => (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs text-muted-foreground font-medium">
                <div className="col-span-3">Description</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              {pagePayments.map((payment) => {
                const status = statusConfig[payment.status] ?? statusConfig.pending
                const project = payment.projects
                return (
                  <div key={payment.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-3">
                      <p className="text-sm font-medium">{payment.label}</p>
                    </div>
                    <div className="col-span-3">
                      {project ? (
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {project.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">{methodLabel[payment.method] ?? payment.method}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">
                        {payment.paid_at
                          ? formatDate(payment.paid_at)
                          : payment.due_date
                          ? `Due ${formatDate(payment.due_date)}`
                          : "—"}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </PaginatedList>
  )
}
