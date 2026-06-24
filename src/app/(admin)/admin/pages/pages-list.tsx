"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import type { CustomPage } from "@/types"
import { PaginatedList } from "@/components/paginated-list"

function formatDate(value?: string): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return "—"
  }
}

export function PagesList({ pages }: { pages: CustomPage[] }) {
  return (
    <PaginatedList
      items={pages}
      pageSize={10}
      searchPlaceholder="Search pages by title, slug, or status..."
      testId="pages"
      searchText={(page: CustomPage) => `${page.title} ${page.slug} ${page.status}`}
    >
      {(pageItems) => (
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {pageItems.map((page) => (
            <Link
              key={page.id}
              href={`/admin/pages/${page.id}`}
              data-testid={`page-row-${page.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
            >
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{page.title}</p>
                  {page.is_homepage && (
                    <Badge variant="brand" className="text-[10px]">Homepage</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">/p/{page.slug}</p>
              </div>
              <Badge
                variant={page.status === "published" ? "default" : "outline"}
                className="flex-shrink-0 capitalize"
              >
                {page.status}
              </Badge>
              <span className="text-xs text-muted-foreground flex-shrink-0 w-28 text-right hidden sm:block">
                {formatDate(page.updated_at ?? page.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PaginatedList>
  )
}
