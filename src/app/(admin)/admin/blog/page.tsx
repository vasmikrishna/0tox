import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BlogList } from "./blog-list"

export default function AdminBlogListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-1">Create and publish blog posts</p>
        </div>
        <Button asChild data-testid="blog-new">
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>

      <BlogList />
    </div>
  )
}
