import type { Metadata } from "next"
import { GalleryClient } from "./gallery-client"

export const metadata: Metadata = {
  title: "Website Templates | Site9",
  description: "Browse 100+ professionally designed website templates. Pick one and launch your site in minutes.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Website Templates | Site9",
    description: "Browse 100+ professionally designed website templates. Pick one and launch your site in minutes.",
  },
}

export default function TemplatesPage() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Website Templates</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our collection of professionally designed templates. Pick one, customize it, and launch your site in minutes.
        </p>
      </div>
      <GalleryClient />
    </section>
  )
}
