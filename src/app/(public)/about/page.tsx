import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"
import { getSiteSettings, s } from "@/lib/site-settings"

export const metadata = { title: "About Us | 0→X IT Services" }

export default async function AboutPage() {
  const settings = await getSiteSettings()

  const stats = [
    { num: s(settings, "about_stat_1_num"), label: s(settings, "about_stat_1_label") },
    { num: s(settings, "about_stat_2_num"), label: s(settings, "about_stat_2_label") },
    { num: s(settings, "about_stat_3_num"), label: s(settings, "about_stat_3_label") },
    { num: s(settings, "about_stat_4_num"), label: s(settings, "about_stat_4_label") },
  ]

  const values = [
    { title: "No lock-in contracts", desc: "Month-to-month where possible. We earn your continued business." },
    { title: "Plain English", desc: "We explain what we do in terms that make sense, not tech speak." },
    { title: "Fast response", desc: "We pick up the phone. Real support from real people." },
    { title: "Transparent pricing", desc: "You know what you&apos;re paying before we start. No surprises." },
    { title: "You own everything", desc: "Your website, your data, your code. No strings attached." },
    { title: "Local & reliable", desc: "Australian-owned and operated. We understand Australian business." },
  ]

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">{s(settings, "about_heading")}</h1>
          <p className="mt-3 text-white/70 max-w-xl text-lg">
            A local tech company that gets the job done — without the big agency price tag.
          </p>
        </div>
      </section>

      {/* About intro */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--site-primary)" }}>
                Our story
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">{s(settings, "about_intro")}</p>
              <div className="mt-6 space-y-3">
                {[
                  "Fast delivery — live in days, not months",
                  "Production-ready, maintainable solutions",
                  "Full ownership — your code, your servers",
                  "Ongoing support when you need it",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "var(--site-accent)" }} />
                    {item}
                  </div>
                ))}
              </div>
              {s(settings, "contact_linkedin") && (
                <a
                  href={s(settings, "contact_linkedin")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--site-primary)" }}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Connect on LinkedIn
                </a>
              )}
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
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>How we work</h2>
            <p className="mt-2 text-gray-500">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="p-5 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
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
          <h2 className="text-2xl font-bold">Let&apos;s work together</h2>
          <p className="mt-2 text-white/80">Get in touch today for a no-obligation chat about your tech needs.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 mt-6 rounded bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ color: "var(--site-accent)" }}
          >
            Contact us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
