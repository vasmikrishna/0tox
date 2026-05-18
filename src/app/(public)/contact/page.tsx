"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Send } from "lucide-react"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--site-primary)" }} className="text-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold">Get in Touch</h1>
          <p className="mt-3 text-white/70 max-w-xl text-lg">
            No obligation, no jargon — just an honest conversation about how we can help your business.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20" style={{ background: "var(--site-bg)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12">

            {/* Contact details */}
            <div>
              <h2 className="text-xl font-bold mb-6" style={{ color: "var(--site-primary)" }}>Contact details</h2>
              <div className="space-y-4">
                <ContactItem
                  icon={<Phone className="h-5 w-5" />}
                  label="Phone"
                  value="+61 400 000 000"
                  href="tel:+61400000000"
                />
                <ContactItem
                  icon={<Mail className="h-5 w-5" />}
                  label="Email"
                  value="hello@nexoit.com.au"
                  href="mailto:hello@nexoit.com.au"
                />
                <ContactItem
                  icon={<MapPin className="h-5 w-5" />}
                  label="Location"
                  value="Australia — Remote-first, serving clients nationwide"
                />
                <ContactItem
                  icon={<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
                  label="LinkedIn"
                  value="Connect with us"
                  href="https://linkedin.com"
                />
              </div>

              <div className="mt-8 p-5 rounded-lg border border-gray-200 bg-white">
                <h3 className="font-semibold mb-2" style={{ color: "var(--site-primary)" }}>Typical response time</h3>
                <p className="text-sm text-gray-600">We respond to all enquiries within 24 hours on business days. For urgent IT issues, please call us directly.</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {status === "sent" ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "var(--site-primary)" }}>Message sent!</h3>
                  <p className="text-gray-600 text-sm">Thanks for getting in touch. We&apos;ll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-bold mb-4" style={{ color: "var(--site-primary)" }}>Send us a message</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Full name *" required>
                      <input
                        type="text"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                        style={{ "--tw-ring-color": "var(--site-primary)" } as any}
                      />
                    </FormField>
                    <FormField label="Email *" required>
                      <input
                        type="email"
                        placeholder="jane@example.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Phone">
                      <input
                        type="tel"
                        placeholder="0400 000 000"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                      />
                    </FormField>
                    <FormField label="Service interested in">
                      <select
                        value={form.service}
                        onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white"
                      >
                        <option value="">— select —</option>
                        <option value="it">IT Support &amp; Infrastructure</option>
                        <option value="web">Web Services</option>
                        <option value="ms365">Microsoft 365</option>
                        <option value="other">Not sure / Other</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Message *" required>
                    <textarea
                      placeholder="Tell us a bit about your business and what you need help with..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={4}
                      className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none"
                    />
                  </FormField>

                  {status === "error" && (
                    <p className="text-sm text-red-500">Something went wrong. Please try emailing us directly.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full flex items-center justify-center gap-2 rounded px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--site-accent)" }}
                  >
                    <Send className="h-4 w-4" />
                    {status === "sending" ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ContactItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--site-accent)" }}>{icon}</span>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
        className="block hover:opacity-80 transition-opacity">
        {inner}
      </a>
    )
  }
  return <div>{inner}</div>
}
