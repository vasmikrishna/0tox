import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check, Mail } from "lucide-react"
import { MOCK_PORTFOLIO, MOCK_CUSTOM_PAGES } from "@/lib/mock-data"
import type { CustomPage } from "@/types"
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize-html"
import { FEATURES } from "@/lib/features"
import { FormHandler } from "@/components/public/form-handler"

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
    const { getCurrentTenant, getTenantSlug } = await import("@/lib/tenant")
    const slug = await getTenantSlug()
    // Don't override the main marketing page — only show tenant homepages
    // on real subdomains (not the localhost fallback "0tox" tenant)
    if (slug === "0tox" || !slug) return null
    const supabase = await createClient()
    const tenant = await getCurrentTenant().catch(() => null)
    if (!tenant?.id) return null
    const { data } = await supabase
      .from("custom_pages")
      .select("*")
      .eq("is_homepage", true)
      .eq("status", "published")
      .eq("tenant_id", tenant.id)
      .maybeSingle()
    return (data as CustomPage | null) ?? null
  } catch {
    return null
  }
}

const SERVICES = [
  {
    tier: "launch",
    name: "Launch in minutes",
    tagline: "Go live before lunch",
    description: "Enter your business info and launch a professional website in minutes — no coding, no design skills, no complicated setup.",
    price: "Free to start",
    price_note: "your own subdomain included",
    features: ["Instant website creation", "Free yourbusiness.site9.in subdomain", "Mobile responsive", "No coding or design skills"],
    highlight: false,
  },
  {
    tier: "showcase",
    name: "Show off your business",
    tagline: "Everything your customers need to know",
    description: "Tell your story, show your work, and make it easy for customers to reach you — all from one simple business profile.",
    price: "Free to start",
    price_note: "your own subdomain included",
    features: ["Business profile (services, hours, address)", "Image gallery", "WhatsApp integration", "Contact forms & lead capture", "Google Maps"],
    highlight: true,
  },
  {
    tier: "grow",
    name: "Get found & grow",
    tagline: "Turn your site into a growth engine",
    description: "Get discovered on Google, create content with AI, and track your visitors — with the option to bring your own domain.",
    price: "Free to start",
    price_note: "your own subdomain included",
    features: ["SEO ready", "AI content generation", "Analytics dashboard", "Custom domain support", "Secure managed hosting"],
    highlight: false,
  },
]

const PRICING = [
  {
    name: "Starter",
    price: "₹9",
    period: "/month",
    tagline: "Get your business online",
    features: ["1 website", "Free yourbusiness.site9.in subdomain", "Mobile responsive", "Business profile", "WhatsApp button", "Contact form"],
    available: true,
  },
  {
    name: "Business",
    price: "₹99",
    period: "/month",
    tagline: "Stand out and get found",
    features: ["Everything in Starter", "Image gallery", "Google Maps", "SEO ready", "AI content generation", "Analytics", "No Site9 badge"],
    available: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    tagline: "Your own brand and domain",
    features: ["Everything in Business", "Custom domain (yourbusiness.com)", "Multi-page website", "Premium templates", "Priority support"],
    available: false,
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
  { href: "#services", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#portfolio", label: "Examples" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
]

export default async function LandingPage() {
  // If an admin has published a custom homepage, render it instead of the default landing page.
  const homepageOverride = await getHomepageOverride()
  if (homepageOverride) {
    return (
      <FormHandler>
        <style dangerouslySetInnerHTML={{ __html: sanitizeCss(homepageOverride.css) }} />
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(homepageOverride.html) }} />
      </FormHandler>
    )
  }

  const portfolio = await getPortfolio()

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" data-testid="home-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark-dark.svg" alt="" aria-hidden="true" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight">Site<span className="text-[#2B6BFF]">9</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
            <Button asChild variant="brand" size="sm"><Link href="/start">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <Badge variant="outline" className="mb-6">A website for every business</Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          One Website for Every Business
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Whether you&apos;re a local shop, freelancer, photographer, restaurant, salon, PG owner, consultant, or startup — Site9 makes it simple, affordable, and accessible to get your business online. No coding. No design skills. No complicated setup.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Button asChild variant="brand" size="lg">
            <Link href="/start">Create your website <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#portfolio">See examples</a>
          </Button>
        </div>

        {/* Trust bar */}
        <div className="flex items-center justify-center gap-8 mt-16 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Launch in minutes</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Free yourbusiness.site9.in subdomain</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> No coding needed</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Works on any device</span>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-muted/40 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need to get online</h2>
            <p className="text-muted-foreground mt-2">Launch, showcase, and grow — all from one simple platform.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <Card key={service.tier} className={service.highlight ? "border-foreground" : ""}>
                <CardContent className="p-6 space-y-5">
                  {service.highlight && <Badge variant="brand" className="text-xs">Most loved</Badge>}
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
                      <Link href="/start">Create your website <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, honest pricing</h2>
            <p className="text-muted-foreground mt-2">Get online for just ₹9/month. No setup fees, cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {PRICING.map((plan) => (
              <Card key={plan.name} className={plan.available ? "border-foreground shadow-lg" : ""}>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.available
                      ? <Badge variant="brand" className="text-xs">Available now</Badge>
                      : <Badge variant="outline" className="text-xs">Coming soon</Badge>}
                  </div>
                  <p className="text-muted-foreground text-sm">{plan.tagline}</p>
                  <div>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <div className="space-y-2">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                  {plan.available ? (
                    <Button asChild variant="brand" size="sm" className="w-full" data-testid={`plan-${plan.name.toLowerCase()}-cta`}>
                      <Link href="/start">Create your website <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" disabled data-testid={`plan-${plan.name.toLowerCase()}-cta`}>
                      Coming soon
                    </Button>
                  )}
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
              <h2 className="text-3xl font-bold">Made with Site9</h2>
              <p className="text-muted-foreground mt-2">Real businesses already online — like cafe.site9.in, salon.site9.in, and photographer.site9.in</p>
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
              <h2 className="text-3xl font-bold">About Site9</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                <strong className="text-foreground">Our vision</strong> is to bring every business online. We imagine a future where having a website is as common as having a phone number, email, or WhatsApp account. Every business deserves its own digital identity.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Millions of businesses still rely only on social media, WhatsApp, or word of mouth — and building a website is too often expensive, slow, and technically complex. Site9 removes the barriers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Getting online shouldn&apos;t be complicated. Getting a website shouldn&apos;t require a developer. Every business deserves a professional online presence.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> No coding — launch in minutes
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Free yourbusiness.site9.in subdomain
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Simple, affordable, and accessible
                </div>
              </div>
              <Link
                href="/start"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-4 py-2"
              >
                Create your website
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">Minutes</p>
                <p className="text-sm text-muted-foreground mt-1">to launch</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">No code</p>
                <p className="text-sm text-muted-foreground mt-1">needed</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">Free</p>
                <p className="text-sm text-muted-foreground mt-1">subdomain</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 pb-5 px-5">
                <p className="text-3xl font-bold">Any device</p>
                <p className="text-sm text-muted-foreground mt-1">responsive</p>
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
            Ready to get your business online? Create your website now, or reach out and we&apos;ll help you get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="brand" size="lg">
              <Link href="/start">Create your website <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <a
              href="mailto:hello@site9.in"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" /> hello@site9.in
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold">Site9</span>
          <p className="text-sm text-muted-foreground">One Website for Every Business.</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@site9.in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              hello@site9.in
            </a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
