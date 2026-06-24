"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ArrowRight, User } from "lucide-react"
import { PaginatedList } from "@/components/paginated-list"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientsList({ clients }: { clients: any[] }) {
  return (
    <PaginatedList
      items={clients}
      pageSize={10}
      searchPlaceholder="Search clients by name or email..."
      testId="clients"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchText={(c: any) => `${c.name} ${c.email}`}
    >
      {(pageClients) => (
        <div className="space-y-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {pageClients.map((client: any) => (
            <Card key={client.id}>
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {client.name?.charAt(0)?.toUpperCase() ?? <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{client.projects?.length ?? 0} projects</span>
                  <span className="text-xs text-muted-foreground">Joined {formatDate(client.created_at)}</span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/clients/${client.id}`}><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PaginatedList>
  )
}
