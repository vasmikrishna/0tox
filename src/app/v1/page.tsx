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
      photo: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=800&q=80",
      title: s(settings, "services_it_title"),
      tagline: s(settings, "services_it_tagline"),
      desc: s(settings, "services_it_desc"),
      feats: features(settings, "services_it_features").slice(0, 4),
    },
    {
      key: "web",
      icon: "🌐",
      photo: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=80",
      title: s(settings, "services_web_title"),
      tagline: s(settings, "services_web_tagline"),
      desc: s(settings, "services_web_desc"),
      feats: features(settings, "services_web_features").slice(0, 4),
    },
    {
      key: "ms365",
      icon: "☁️",
      photo: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=800&q=80",
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
      avatar: "/images/avatar-james-carter.png",
    },
    {
      name: s(settings, "testimonial_2_name"),
      role: s(settings, "testimonial_2_role"),
      text: s(settings, "testimonial_2_text"),
      avatar: "/images/avatar-sarah-mitchell.png",
    },
    {
      name: s(settings, "testimonial_3_name"),
      role: s(settings, "testimonial_3_role"),
      text: s(settings, "testimonial_3_text"),
      avatar: "/images/avatar-david-nguyen.png",
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

            {/* Hero visual — premium dashboard mockup */}
            <div className="hidden md:block relative">
              {/* Glow backdrop effect */}
              <div 
                className="absolute -inset-4 rounded-3xl blur-3xl opacity-30 animate-pulse pointer-events-none" 
                style={{ background: "radial-gradient(circle, var(--site-accent) 0%, transparent 70%)" }}
              />
              <div className="relative bg-slate-900/60 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-500 ease-out">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1 border-b border-white/5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="text-[10px] text-white/30 ml-4 font-mono tracking-wider select-none">portal.0tox.com</span>
                </div>
                {/* Image display */}
                <div className="overflow-hidden rounded-lg bg-slate-950 aspect-square shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/client_portal_hero.png"
                    alt="0toX Client Portal Dashboard Mockup"
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
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
              <div key={svc.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
                <div className="h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={svc.photo} alt={svc.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-1">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Visual Process Timeline ── */}
      <section className="py-16 sm:py-20 border-t border-b border-gray-100" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: "color-mix(in srgb, var(--site-accent) 10%, white)", color: "var(--site-accent)" }}>
              Simple & Streamlined
            </span>
            <h2 className="text-3xl font-bold mt-4" style={{ color: "var(--site-primary)" }}>How 0toX Portal Works</h2>
            <p className="mt-2 text-base max-w-xl mx-auto text-gray-600">
              No messy email chains or lost attachments. Manage your entire project lifecyle, stripe invoice payments, and file deliveries in one secure workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-gray-100 -translate-y-12 z-0" />

            {/* Step 1 */}
            <div className="relative bg-gray-50/50 hover:bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center z-10">
              <div className="absolute -top-6 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--site-primary) 0%, var(--site-accent) 100%)" }}>
                1
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner bg-white border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                📝
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "var(--site-primary)" }}>1. Configure & Submit</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Choose your service tier, answer custom intake questions, and launch your project instantly inside the secure client dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-gray-50/50 hover:bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center z-10">
              <div className="absolute -top-6 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--site-primary) 0%, var(--site-accent) 100%)" }}>
                2
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner bg-white border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                📊
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "var(--site-primary)" }}>2. Track Stages Live</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Monitor real-time progress as we build. See visible deliverables, checklists, and project milestones update live.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-gray-50/50 hover:bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center z-10">
              <div className="absolute -top-6 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--site-primary) 0%, var(--site-accent) 100%)" }}>
                3
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner bg-white border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                💳
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "var(--site-primary)" }}>3. Pay & Download</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Review finished work, complete secure Stripe payments, and download certified files directly from your workspace.
              </p>
            </div>
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
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-150 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ background: "var(--site-primary)" }}>
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--site-primary)" }}>{t.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{t.role}</p>
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
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: item.bg }}>
                      <span>{item.emoji}</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-semibold uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-bold leading-tight text-base" style={{ color: "var(--site-primary)" }}>{item.title}</p>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{item.shortDescription}</p>
                  </div>
                  {item.metrics && item.metrics.length > 0 && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 flex-wrap">
                      {item.metrics.slice(0, 2).map((m, idx) => (
                        <span key={idx} className="inline-flex items-center text-[10px] px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-500 font-medium">
                          {m.label}: <strong className="text-slate-900 ml-1">{m.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
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
