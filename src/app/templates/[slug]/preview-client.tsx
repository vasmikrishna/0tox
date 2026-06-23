"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { GalleryTemplate } from "@/types"

type Viewport = "desktop" | "tablet" | "mobile"
const VIEWPORT_WIDTHS: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "375px" }

export function TemplatePreviewClient({ template }: { template: GalleryTemplate }) {
  const [viewport, setViewport] = useState<Viewport>("desktop")

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif;}${template.css}</style></head><body>${template.html}</body></html>`

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates" data-testid="back-to-gallery">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border p-1 gap-1">
            {([
              { key: "desktop" as const, Icon: Monitor },
              { key: "tablet" as const, Icon: Tablet },
              { key: "mobile" as const, Icon: Smartphone },
            ]).map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setViewport(key)}
                data-testid={`viewport-${key}`}
                className={`p-1.5 rounded-md transition-colors ${viewport === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Button asChild variant="brand" data-testid="use-template-btn">
            <Link href={`/build?template=${template.slug}`}>
              <ExternalLink className="h-4 w-4" /> Use this template
            </Link>
          </Button>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        {[template.category, template.industry, template.style, ...template.tags].map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
        ))}
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="overflow-hidden rounded-xl border bg-white shadow-2xl transition-all duration-300"
          style={{ width: VIEWPORT_WIDTHS[viewport], maxWidth: "100%" }}
        >
          <iframe
            title={`Preview of ${template.name}`}
            srcDoc={srcDoc}
            sandbox=""
            className="w-full border-none"
            style={{ height: "80vh" }}
            data-testid="template-preview-iframe"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Ready to use this template?</h2>
        <p className="text-muted-foreground mt-2">Customize the content and publish your website in minutes.</p>
        <Button asChild variant="brand" size="lg" className="mt-5" data-testid="use-template-cta">
          <Link href={`/build?template=${template.slug}`}>
            Get started with {template.name}
          </Link>
        </Button>
      </div>
    </div>
  )
}
