import { SuperadminBlogList } from "./superadmin-blog-list"

export default function SuperadminBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <p className="text-muted-foreground mt-1">Manage blog posts from all tenants</p>
      </div>

      <SuperadminBlogList />
    </div>
  )
}
