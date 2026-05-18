import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"
import type { SiteSettings } from "@/lib/site-settings"

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer style={{ background: "var(--site-primary)", color: "#fff" }} className="mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-xl font-bold mb-2">{settings.site_name}</div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">{settings.footer_tagline}</p>
            {settings.contact_linkedin && (
              <a href={settings.contact_linkedin} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-white/70 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            )}
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/50 mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/services#it" className="hover:text-white transition-colors">IT Support & Infrastructure</Link></li>
              <li><Link href="/services#web" className="hover:text-white transition-colors">Web Services</Link></li>
              <li><Link href="/services#ms365" className="hover:text-white transition-colors">Microsoft 365</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/50 mb-3">Get in touch</h4>
            <ul className="space-y-2 text-sm text-white/75">
              {settings.contact_phone && (
                <li>
                  <a href={`tel:${settings.contact_phone.replace(/\s/g,"")}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {settings.site_name}. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white/70 transition-colors">Client portal</Link>
            {settings.v1_active === "true" && (
              <Link href="/v1" className="hover:text-white/70 transition-colors">Classic site</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
