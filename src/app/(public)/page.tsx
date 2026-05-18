import Link from "next/link"
import { Phone, Check, Star, ArrowRight, Shield, Clock, Award, Users } from "lucide-react"
import { getSiteSettings, s, features } from "@/lib/site-settings"
import { PORTFOLIO_SEED } from "@/lib/portfolio-seed"

export default async function HomePage() {
  const settings = await getSiteSettings()
  const portfolio = PORTFOLIO_SEED.slice(0, 3)

  const phone = s(settings, "contact_phone")
  const email = s(settings, "contact_email")

  const serviceCards = [
    {
      key: "it",
      icon: "🖥️",
      title: s(settings, "services_it_title"),
      tagline: s(settings, "services_it_tagline"),
      desc: s(settings, "services_it_desc"),
      feats: features(settings, "services_it_features").slice(0, 4),
    },
    {
      key: "web",
      icon: "🌐",
      title: s(settings, "services_web_title"),
      tagline: s(settings, "services_web_tagline"),
      desc: s(settings, "services_web_desc"),
      feats: features(settings, "services_web_features").slice(0, 4),
    },
    {
      key: "ms365",
      icon: "☁️",
      title: s(settings, "services_ms365_title"),
      tagline: s(settings, "services_ms365_tagline"),
      desc: s(settings, "services_ms365_desc"),
      feats: features(settings, "services_ms365_features").slice(0, 4),
    },
  ]

  const testimonials = [
    {
      name: s(settings, "testimonial_1_name"),
      role: s(settings, "testimonial_1_role"),
      text: s(settings, "testimonial_1_text"),
    },
    {
      name: s(settings, "testimonial_2_name"),
      role: s(settings, "testimonial_2_role"),
      text: s(settings, "testimonial_2_text"),
    },
    {
      name: s(settings, "testimonial_3_name"),
      role: s(settings, "testimonial_3_role"),
      text: s(settings, "testimonial_3_text"),
    },
  ]

  const stats = [
    { num: s(settings, "about_stat_1_num"), label: s(settings, "about_stat_1_label") },
    { num: s(settings, "about_stat_2_num"), label: s(settings, "about_stat_2_label") },
    { num: s(settings, "about_stat_3_num"), label: s(settings, "about_stat_3_label") },
    { num: s(settings, "about_stat_4_num"), label: s(settings, "about_stat_4_label") },
  ]

  return (
    <>
      {/* ── Hero ── */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-16 sm:py-24 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--site-accent)" }} />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full blur-3xl bg-white/30" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Australian-owned · Remote-first · No lock-in contracts
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                {s(settings, "hero_headline")}
              </h1>
              <p className="mt-5 text-lg text-white/80 leading-relaxed">
                {s(settings, "hero_sub")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--site-accent)", color: "#fff" }}
                >
                  {s(settings, "hero_cta_primary")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  {s(settings, "hero_cta_secondary")}
                </Link>
              </div>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 mt-6 text-white/70 hover:text-white text-sm transition-colors">
                  <Phone className="h-4 w-4" /> Call us: {phone}
                </a>
              )}
            </div>

            {/* Hero visual — service cards mockup */}
            <div className="hidden md:block relative">
              <div className="relative">
                {/* Floating card 1 */}
                <div className="bg-white rounded-xl shadow-2xl p-5 transform rotate-2 absolute top-0 right-0 w-72 z-20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, var(--site-accent) 15%, white)" }}>🖥️</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--site-primary)" }}>IT Support</div>
                      <div className="text-xs text-gray-500">Active · 24/7</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 rounded-full w-4/5" style={{ background: "var(--site-accent)" }} /></div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 rounded-full w-3/5" style={{ background: "var(--site-accent)" }} /></div>
                  </div>
                </div>

                {/* Floating card 2 */}
                <div className="bg-white rounded-xl shadow-2xl p-5 transform -rotate-3 absolute top-32 left-0 w-72 z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: "color-mix(in srgb, var(--site-primary) 15%, white)" }}>🌐</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--site-primary)" }}>Web Services</div>
                      <div className="text-xs text-gray-500">5 projects live</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">Custom sites built fast</div>
                </div>

                {/* Floating card 3 */}
                <div className="bg-white rounded-xl shadow-2xl p-5 absolute top-64 right-8 w-72">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-blue-50">☁️</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--site-primary)" }}>Microsoft 365</div>
                      <div className="text-xs text-green-600">✓ Migrated</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Email</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Teams</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">SharePoint</span>
                  </div>
                </div>

                {/* Spacer to ensure container has height */}
                <div className="h-96" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div style={{ background: "var(--site-primary)" }} className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white/80 text-sm">
            {[
              { icon: <Shield className="h-4 w-4" />, text: "No lock-in contracts" },
              { icon: <Clock className="h-4 w-4" />, text: "Fast response times" },
              { icon: <Award className="h-4 w-4" />, text: "Local Australian business" },
              { icon: <Users className="h-4 w-4" />, text: "Plain English — no jargon" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: "var(--site-accent)" }}>{t.icon}</span>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>How we can help</h2>
            <p className="mt-2 text-base" style={{ color: "var(--site-text)", opacity: 0.7 }}>
              Practical tech services for Australian small businesses
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {serviceCards.map((svc) => (
              <div key={svc.key} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4"
                  style={{ background: "color-mix(in srgb, var(--site-primary) 8%, white)" }}>
                  {svc.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--site-primary)" }}>{svc.title}</h3>
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--site-accent)" }}>{svc.tagline}</p>
                <p className="text-sm leading-relaxed text-gray-700 mb-4">{svc.desc}</p>
                <ul className="space-y-2 flex-1">
                  {svc.feats.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--site-accent)" }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/services#${svc.key}`}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--site-primary)" }}
                >
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: "var(--site-primary)" }} className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold">{stat.num}</div>
                <div className="text-sm text-white/65 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>What our clients say</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--site-text)", opacity: 0.7 }}>
              Real feedback from Australian businesses we&apos;ve helped
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => {
              const initials = t.name.split(" ").map(n => n[0]).join("").slice(0, 2)
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ background: "var(--site-primary)" }}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--site-primary)" }}>{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Portfolio preview ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>Recent work</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--site-text)", opacity: 0.7 }}>
              Sites and solutions we&apos;ve delivered for Australian businesses
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <Link
                key={item.slug}
                href={`/work/${item.slug}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group"
              >
                <div
                  className="aspect-video flex items-center justify-center text-5xl relative overflow-hidden"
                  style={{ background: item.bg }}
                >
                  <div className="absolute inset-0 opacity-25" style={{
                    backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0%, transparent 50%)",
                  }} />
                  <span className="relative drop-shadow-md">{item.emoji}</span>
                  <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-white/25 backdrop-blur text-white font-medium uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
                <div className="p-5 flex-1">
                  <p className="font-bold leading-tight" style={{ color: "var(--site-primary)" }}>{item.title}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--site-primary)" }}
            >
              View all our work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{ background: "var(--site-accent)" }} className="py-14 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-white/85">
            Talk to us today — no obligation, no jargon, just straight answers about what we can do for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ color: "var(--site-accent)" }}
            >
              Get a free quote <ArrowRight className="h-4 w-4" />
            </Link>
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Phone className="h-4 w-4" /> {phone}
              </a>
            )}
          </div>
          {email && (
            <p className="mt-4 text-sm text-white/60">
              Or email us at{" "}
              <a href={`mailto:${email}`} className="underline hover:text-white">{email}</a>
            </p>
          )}
        </div>
      </section>
    </>
  )
}
