import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check, Mail, MapPin } from "lucide-react"
import { MOCK_PORTFOLIO, MOCK_CUSTOM_PAGES } from "@/lib/mock-data"
import type { CustomPage } from "@/types"
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize-html"
import { FEATURES } from "@/lib/features"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getHomepageOverride(): Promise<CustomPage | null> {
  if (!FEATURES.pageBuilder) return null
  if (!supabaseConfigured()) {
    return MOCK_CUSTOM_PAGES.find((p) => p.is_homepage && p.status === "published") ?? null
  }
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const { getCurrentTenant } = await import("@/lib/tenant")
    const supabase = await createClient()
    const tenant = await getCurrentTenant().catch(() => null)
    let query = supabase
      .from("custom_pages")
      .select("*")
      .eq("is_homepage", true)
      .eq("status", "published")
    if (tenant?.id) query = query.eq("tenant_id", tenant.id)
    const { data } = await query.maybeSingle()
    return (data as CustomPage | null) ?? null
  } catch {
    return null
  }
}

const SERVICES = [
  {
    tier: "starter",
    name: "Starter",
    tagline: "Your first step online",
    description: "A clean, fast 5-page website to establish your presence. Perfect for small businesses, freelancers, and personal brands.",
    price: "$300",
    price_note: "one-time",
    features: ["Up to 5 pages", "Mobile responsive", "Contact form", "Basic SEO", "Delivered in 3–5 days", "1 revision round"],
    highlight: false,
  },
  {
    tier: "standard",
    name: "Standard",
    tagline: "A site that works harder",
    description: "Multi-page website with animations, optional CMS, and deeper integrations. Built to convert and scale.",
    price: "$2,500",
    price_note: "one-time",
    features: ["Up to 15 pages", "Animations & transitions", "Optional CMS", "Advanced SEO", "Third-party integrations", "2 revision rounds"],
    highlight: false,
  },
  {
    tier: "pro",
    name: "Pro",
    tagline: "From idea to full product",
    description: "Complete web application with user login, dashboards, databases, and custom features. Zero to X.",
    price: "Custom",
    price_note: "scoped to your project",
    features: ["Full web app", "User authentication", "Database & storage", "Admin dashboard", "Custom features", "3 revision rounds"],
    highlight: true,
  },
]

async function getPortfolio() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")) return MOCK_PORTFOLIO
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data } = await supabase.from("portfolio_items").select("*").eq("visible", true).order("sort_order").limit(6)
    return data?.length ? data : MOCK_PORTFOLIO
  } catch {
    return MOCK_PORTFOLIO
  }
}

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#portfolio", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
]

export default async function LandingPage() {
  // If an admin has published a custom homepage, render it instead of the default landing page.
  const homepageOverride = await getHomepageOverride()
  if (homepageOverride) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: sanitizeCss(homepageOverride.css) }} />
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(homepageOverride.html) }} />
      </>
    )
  }

  const portfolio = await getPortfolio()

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">0toX</span>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
            <Button asChild variant="brand" size="sm"><Link href="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <Badge variant="outline" className="mb-6">Remote-first · Based in Australia</Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          0 → X
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We help you establish your online presence — from a clean landing page to a full product with users, payments, and a dashboard. Fast, clean, and fully delivered.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Button asChild variant="brand" size="lg">
            <Link href="/register">Start a project <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#services">See what we build</a>
          </Button>
        </div>

        {/* Trust bar */}
        <div className="flex items-center justify-center gap-8 mt-16 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Fast delivery</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Clean, production-ready code</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Transparent progress</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> You own everything</span>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-muted/40 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What we build</h2>
            <p className="text-muted-foreground mt-2">Three tiers. One team. Priced for where you are.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <Card key={service.tier} className={service.highlight ? "border-foreground" : ""}>
                <CardContent className="p-6 space-y-5">
                  {service.highlight && <Badge variant="brand" className="text-xs">Most popular</Badge>}
                  <div>
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{service.tagline}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  <div className="space-y-2">
                    {service.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-2xl font-bold mt-3">{service.price}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{service.price_note}</p>
                    <Button asChild variant={service.highlight ? "brand" : "outline"} size="sm" className="w-full mt-4">
                      <Link href="/register">Get started <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Our work</h2>
              <p className="text-muted-foreground mt-2">Products and sites we&apos;ve shipped</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((item: any) => (
                <Card key={item.id} className="overflow-hidden group hover:border-foreground/30 transition-colors">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        {item.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                      </div>
                      {item.live_url && item.live_url !== "#" && (
                        <a href={item.live_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                          <ArrowRight className="h-4 w-4 rotate-[-45deg]" />
                        </a>
                      )}
                    </div>
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.tags.map((tag: string) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section id="about" className="bg-muted/40 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold">About 0 to X</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Hi, I&apos;m <strong className="text-foreground">Vamsi Krishna Chinipireddy</strong> — a full-stack developer who turns ideas into live products.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I built 0toX to give businesses a direct line to high-quality web development without agency overhead. No bloat, no middlemen — just fast, clean builds you fully own.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Speed — live in days, not months
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Quality — production-ready, maintainable code
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Full ownership — your code, your servers
                </div>
              </div>
              <a
                href="https://www.linkedin.com/in/vkreddy001/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-4 py-2"
              >
                ↗ Connect on LinkedIn
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">3–5</p>
                <p className="text-sm text-muted-foreground mt-1">Days to ship a Starter site</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground mt-1">Code ownership — yours</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground mt-1">Agency markup</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">24h</p>
                <p className="text-sm text-muted-foreground mt-1">Response time</p>
              </CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold">Get in touch</h2>
          <p className="text-muted-foreground text-lg">
            Have a project in mind? Tell us about it — we&apos;ll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="brand" size="lg">
              <Link href="/register">Start a project <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <a
              href="mailto:hello@0tox.com"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" /> hello@0tox.com
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
            <MapPin className="h-4 w-4" /> Remote-first · Australia
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold">0toX</span>
          <p className="text-sm text-muted-foreground">We help you establish your online presence.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/vkreddy001/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Client login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
