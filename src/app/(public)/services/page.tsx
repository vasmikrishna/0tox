import Link from "next/link"
import { Check, Phone, ArrowRight } from "lucide-react"
import { getSiteSettings, s, features } from "@/lib/site-settings"

export const metadata = { title: "Features | Site9" }

export default async function ServicesPage() {
  const settings = await getSiteSettings()
  const phone = s(settings, "contact_phone")

  const services = [
    {
      id: "it",
      icon: "🚀",
      title: s(settings, "services_it_title"),
      tagline: s(settings, "services_it_tagline"),
      desc: s(settings, "services_it_desc"),
      feats: features(settings, "services_it_features"),
    },
    {
      id: "web",
      icon: "🏪",
      title: s(settings, "services_web_title"),
      tagline: s(settings, "services_web_tagline"),
      desc: s(settings, "services_web_desc"),
      feats: features(settings, "services_web_features"),
    },
    {
      id: "ms365",
      icon: "📈",
      title: s(settings, "services_ms365_title"),
      tagline: s(settings, "services_ms365_tagline"),
      desc: s(settings, "services_ms365_desc"),
      feats: features(settings, "services_ms365_features"),
    },
  ]

  return (
    <>
      {/* Page hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">Everything you need to get online</h1>
          <p className="mt-3 text-white/70 max-w-xl text-lg">
            Launch, showcase, and grow your business — all from one simple platform. No coding, no design skills.
          </p>
        </div>
      </section>

      {/* Service sections */}
      <div style={{ background: "var(--site-bg)" }}>
        {services.map((svc, idx) => (
          <section
            key={svc.id}
            id={svc.id}
            className={`py-16 sm:py-20 ${idx % 2 === 1 ? "bg-white" : ""}`}
            style={idx % 2 === 1 ? { background: "#fff" } : {}}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className={idx % 2 === 1 ? "md:order-2" : ""}>
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mb-4"
                    style={{ background: "color-mix(in srgb, var(--site-primary) 10%, white)" }}>
                    {svc.icon}
                  </div>
                  <h2 className="text-3xl font-bold" style={{ color: "var(--site-primary)" }}>
                    {svc.title}
                  </h2>
                  <p className="text-base font-semibold mt-1 mb-4" style={{ color: "var(--site-accent)" }}>
                    {svc.tagline}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-6 text-base">{svc.desc}</p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--site-accent)" }}
                  >
                    Create your website <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className={idx % 2 === 1 ? "md:order-1" : ""}>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                      What&apos;s included
                    </h3>
                    <ul className="space-y-3">
                      {svc.feats.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--site-accent)" }} />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* CTA strip */}
      <section style={{ background: "var(--site-primary)" }} className="py-12 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Ready to get your business online?</h2>
          <p className="mt-2 text-white/70">Enter your business info and launch a professional website in minutes — free to start.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--site-accent)" }}
            >
              Create your website
            </Link>
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Phone className="h-4 w-4" /> {phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
