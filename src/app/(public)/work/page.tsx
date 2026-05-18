import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"
import { getSiteSettings, s } from "@/lib/site-settings"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Our Work | 0→X IT Services" }

async function getPortfolio() {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("visible", true)
      .order("sort_order")
    return data ?? []
  } catch {
    return []
  }
}

const PLACEHOLDER_PROJECTS = [
  {
    id: "p1",
    title: "Office Network Setup",
    description: "Designed and deployed a full NBN and Wi-Fi network for a 12-person office, including firewall and VLAN segmentation.",
    tags: ["IT Infrastructure", "Networking"],
    live_url: null,
    image_url: null,
  },
  {
    id: "p2",
    title: "Trades Business Website",
    description: "5-page website with contact form, Google Maps integration, and mobile-optimised design — delivered in 4 days.",
    tags: ["Web Services", "Starter"],
    live_url: null,
    image_url: null,
  },
  {
    id: "p3",
    title: "Microsoft 365 Migration",
    description: "Migrated a 15-person accounting firm from on-premise Exchange to Microsoft 365, including Teams, SharePoint, and OneDrive.",
    tags: ["Microsoft 365", "Email Migration"],
    live_url: null,
    image_url: null,
  },
  {
    id: "p4",
    title: "Restaurant Website & Booking",
    description: "Website with online menu, reservation form, and social media integration for a local restaurant.",
    tags: ["Web Services", "Standard"],
    live_url: null,
    image_url: null,
  },
  {
    id: "p5",
    title: "IT Support Contract",
    description: "Ongoing managed IT support for a retail business — covering help desk, hardware maintenance, and security monitoring.",
    tags: ["IT Infrastructure", "Managed Support"],
    live_url: null,
    image_url: null,
  },
  {
    id: "p6",
    title: "Client Portal Web App",
    description: "Custom web application with login, project tracking dashboard, and file delivery for a consulting business.",
    tags: ["Web Services", "Pro"],
    live_url: null,
    image_url: null,
  },
]

export default async function WorkPage() {
  const [settings, portfolio] = await Promise.all([getSiteSettings(), getPortfolio()])
  const projects = portfolio.length > 0 ? portfolio : PLACEHOLDER_PROJECTS

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">Our Work</h1>
          <p className="mt-3 text-white/70 max-w-xl text-lg">
            Real projects we&apos;ve delivered for Australian businesses. Take a look at what we can do.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {item.image_url ? (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center text-4xl"
                    style={{ background: "color-mix(in srgb, var(--site-primary) 8%, white)" }}>
                    {item.tags?.[0]?.includes("IT") ? "🖥️" : item.tags?.[0]?.includes("Microsoft") ? "☁️" : "🌐"}
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold" style={{ color: "var(--site-primary)" }}>{item.title}</h3>
                    {item.live_url && item.live_url !== "#" && (
                      <a href={item.live_url} target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{item.description}</p>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--site-accent)" }} className="py-12 text-white text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Want to be our next success story?</h2>
          <p className="mt-2 text-white/80">Get in touch and let&apos;s talk about your project.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 mt-6 rounded bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ color: "var(--site-accent)" }}
          >
            Start a project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
