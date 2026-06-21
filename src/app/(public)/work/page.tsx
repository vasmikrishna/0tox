import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PORTFOLIO_SEED } from "@/lib/portfolio-seed"

export const metadata = { title: "Examples | Site9" }

export default function WorkPage() {
  const projects = PORTFOLIO_SEED

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">Made with Site9</h1>
          <p className="mt-3 text-white/70 max-w-xl text-lg">
            Real businesses already online — like cafe.site9.in, salon.site9.in, and photographer.site9.in. Click any example to take a closer look.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((item) => (
              <Link
                key={item.slug}
                href={`/work/${item.slug}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group"
              >
                {/* Visual */}
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: item.bg }}>
                      <span>{item.emoji}</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white font-medium">
                    {item.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--site-primary)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 line-clamp-3">
                    {item.shortDescription}
                  </p>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                    {item.metrics.map((m, i) => (
                      <div key={i}>
                        <div className="text-sm font-bold" style={{ color: "var(--site-accent)" }}>{m.value}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "var(--site-primary)" }}>
                    Read case study <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--site-accent)" }} className="py-12 text-white text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold">Want your business online next?</h2>
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
