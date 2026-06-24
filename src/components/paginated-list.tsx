"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PaginatedListProps<T> {
  items: T[]
  /** Build the searchable haystack for one item (matched case-insensitively). */
  searchText: (item: T) => string
  /** Render the current page slice (your table body, grid, or cards). */
  children: (pageItems: T[]) => React.ReactNode
  pageSize?: number
  searchPlaceholder?: string
  /** testid prefix for the search input + pager buttons. */
  testId?: string
}

/**
 * Client-side search + pagination wrapper for list/table views. The parent
 * fetches all rows (server component) and hands them in; this filters by the
 * search box and slices to the current page, calling `children` with just that
 * page's items. Controls only appear once they're useful (search always shown;
 * pager shown only when results exceed one page).
 */
export function PaginatedList<T>({
  items,
  searchText,
  children,
  pageSize = 10,
  searchPlaceholder = "Search...",
  testId = "list",
}: PaginatedListProps<T>) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => searchText(it).toLowerCase().includes(q))
  }, [items, query, searchText])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages) // clamp when the filter shrinks results
  const start = (current - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder={searchPlaceholder}
          className="pl-9"
          data-testid={`${testId}-search`}
        />
      </div>

      {query && filtered.length === 0
        ? <p className="text-sm text-muted-foreground text-center py-10">No results for &ldquo;{query}&rdquo;.</p>
        : children(pageItems)}

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="text-muted-foreground">
            Showing {start + 1}&ndash;{Math.min(start + pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={current <= 1}
              onClick={() => setPage(current - 1)} data-testid={`${testId}-prev`}>
              Previous
            </Button>
            <span className="text-muted-foreground tabular-nums">Page {current} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={current >= totalPages}
              onClick={() => setPage(current + 1)} data-testid={`${testId}-next`}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
