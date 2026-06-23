import { BlogForm } from "../blog-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params
  return <BlogForm mode="edit" id={id} />
}
