import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ExternalLink, Check } from "lucide-react"
import { PORTFOLIO_SEED, getProjectBySlug } from "@/lib/portfolio-seed"

export async function generateStaticParams() {
  return PORTFOLIO_SEED.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  if (!project) return { title: "Project not found" }
  return { title: `${project.title} | NexoIT` }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  if (!project) notFound()

  const related = PORTFOLIO_SEED.filter(p => p.slug !== project.slug && p.category === project.category).slice(0, 2)

  return (
    <>
      {/* Hero */}
      <section style={{ background: project.bg }} className="text-white py-14 sm:py-20 relative overflow-hidden">
        {project.cover && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.cover} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        {!project.cover && (
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle at 15% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 85% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)",
          }} />
        )}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
          <Link href="/work" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to all work
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur font-medium">
              {project.category}
            </span>
            {project.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs text-white/80">· {tag}</span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{project.title}</h1>
          <p className="mt-4 text-lg text-white/85 leading-relaxed max-w-2xl">
            {project.shortDescription}
          </p>

          {/* Metric tiles */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 max-w-2xl">
            {project.metrics.map((m, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/15">
                <div className="text-2xl sm:text-3xl font-bold">{m.value}</div>
                <div className="text-xs text-white/70 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="md:col-span-2 space-y-5">
              <h2 className="text-2xl font-bold" style={{ color: "var(--site-primary)" }}>
                The full story
              </h2>
              {project.longDescription.split("\n\n").map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-gray-700">
                  {para}
                </p>
              ))}

              {project.live_url && (
                <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "var(--site-primary)" }}>
                  Visit the live site <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
                  Service category
                </h3>
                <p className="font-semibold mb-1" style={{ color: "var(--site-primary)" }}>
                  {project.category}
                </p>
                <p className="text-xs text-gray-500">{project.tags.length} tags · 1 client</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
                  Tech & tools
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg p-5 text-white" style={{ background: "var(--site-primary)" }}>
                <h3 className="font-bold mb-2">Need something similar?</h3>
                <p className="text-sm text-white/80 mb-4">
                  We&apos;d love to talk about your project — no obligation.
                </p>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold w-full justify-center"
                  style={{ background: "var(--site-accent)" }}>
                  Get in touch <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--site-primary)" }}>
              Related projects
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.slug} href={`/work/${r.slug}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {r.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: r.bg }}>
                        <span>{r.emoji}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight" style={{ color: "var(--site-primary)" }}>
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.shortDescription}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
