import type { Metadata } from "next"
import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"
import { getSiteSettings, s } from "@/lib/site-settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteName = settings.site_name ?? "Site9"
  const description = `Learn about ${siteName} — our vision is to bring every business online.`
  return {
    title: `About Us`,
    description,
    alternates: { canonical: "/about" },
    openGraph: { title: `About Us | ${siteName}`, description },
  }
}

export default async function AboutPage() {
  const settings = await getSiteSettings()

  const stats = [
    { num: s(settings, "about_stat_1_num"), label: s(settings, "about_stat_1_label") },
    { num: s(settings, "about_stat_2_num"), label: s(settings, "about_stat_2_label") },
    { num: s(settings, "about_stat_3_num"), label: s(settings, "about_stat_3_label") },
    { num: s(settings, "about_stat_4_num"), label: s(settings, "about_stat_4_label") },
  ]

  const values = [
    { title: "No coding needed", desc: "Enter your business info and launch — no developer, no design skills." },
    { title: "Launch in minutes", desc: "A professional website online before lunch, on a free subdomain." },
    { title: "Plain and simple", desc: "We keep it simple, affordable, and accessible for every business." },
    { title: "Free to start", desc: "Get online on yourbusiness.site9.in at no cost — upgrade when you grow." },
    { title: "A digital identity", desc: "Every business deserves its own website, not just a social profile." },
    { title: "For everyone", desc: "Shops, freelancers, restaurants, salons, startups — if you have a business, Site9 is for you." },
  ]

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">{s(settings, "about_heading")}</h1>
          <p className="mt-3 text-white/80 max-w-2xl text-lg">
            To bring every business online — where having a website is as common as having a phone number.
          </p>
        </div>
      </section>

      {/* About intro + stats */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--site-primary)" }}>
                Our vision
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">{s(settings, "about_intro")}</p>
              <div className="mt-6 space-y-3">
                {[
                  "Getting online shouldn't be complicated",
                  "Getting a website shouldn't require a developer",
                  "Every business deserves a professional online presence",
                  "Simple, affordable, and accessible for all",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "var(--site-accent)" }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 text-center">
                  <div className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>{stat.num}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>Why Site9</h2>
            <p className="mt-2 text-gray-500">The beliefs that guide everything we build</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="p-5 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3 text-white text-sm font-bold"
                  style={{ background: "var(--site-accent)" }}>
                  {i + 1}
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--site-primary)" }}>{v.title}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--site-accent)" }} className="py-12 text-white text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Get your business online</h2>
          <p className="mt-2 text-white/85">Create your website in minutes — free to start, on your own subdomain.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 mt-6 rounded bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ color: "var(--site-accent)" }}
          >
            Create your website <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
