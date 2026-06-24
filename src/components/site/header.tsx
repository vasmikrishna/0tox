"use client"
import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone, User, ChevronDown, LayoutGrid, LogOut } from "lucide-react"
import type { SiteSettings } from "@/lib/site-settings"

/** Minimal session info the public header needs — passed from the server layout. */
export interface HeaderAuth {
  name: string
  email: string
  role: "admin" | "client" | "employee"
}

function dashboardHref(role: HeaderAuth["role"]): string {
  if (role === "admin") return "/admin/dashboard"
  if (role === "employee") return "/employee/dashboard"
  return "/client/dashboard"
}

export function SiteHeader({ settings, auth }: { settings: SiteSettings; auth: HeaderAuth | null }) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const phone = settings.contact_phone || ""
  const siteName = settings.site_name || "Site9"

  const navLinks = [
    { href: "/services", label: "Services" },
    { href: "/templates", label: "Templates" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
    { href: "/work", label: "Our Work" },
    { href: "/contact", label: "Contact" },
  ]

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch { /* ignore */ }
    window.location.href = "/"
  }

  return (
    <header style={{ background: "var(--site-primary)", color: "#fff" }} className="sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90" data-testid="site-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" aria-hidden="true" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight text-white">
              {siteName === "Site9" ? <>Site<span className="text-[#5C93FF]">9</span></> : siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-white/85 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-sm text-white/85 hover:text-white">
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
            )}
            {auth ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white rounded px-2 py-1.5"
                  data-testid="account-menu-button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold uppercase">
                    {(auth.name || auth.email).charAt(0)}
                  </span>
                  <span className="max-w-[10rem] truncate">{auth.name || auth.email}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {menuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      aria-hidden="true"
                      tabIndex={-1}
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-black/10 bg-white py-1 text-gray-800 shadow-lg"
                      role="menu"
                      data-testid="account-menu"
                    >
                      <div className="border-b border-black/5 px-3 py-2">
                        <p className="truncate text-sm font-semibold">{auth.name || "Account"}</p>
                        <p className="truncate text-xs text-gray-500">{auth.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                        role="menuitem"
                        data-testid="account-menu-businesses"
                      >
                        <LayoutGrid className="h-4 w-4" /> My businesses
                      </Link>
                      <Link
                        href={dashboardHref(auth.role)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                        role="menuitem"
                        data-testid="account-menu-dashboard"
                      >
                        <User className="h-4 w-4" /> My dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-2 border-t border-black/5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        role="menuitem"
                        data-testid="account-menu-signout"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-white/90 hover:text-white"
                data-testid="header-signin"
              >
                Sign in
              </Link>
            )}
            <Link
              href={auth ? "/contact" : "/register"}
              className="text-sm font-semibold rounded px-4 py-1.5 transition-colors hover:opacity-90"
              style={{ background: "var(--site-accent)", color: "#fff" }}
              data-testid={auth ? "header-contact" : "header-signup"}
            >
              {auth ? "Get in touch" : "Sign up"}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white p-1" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-3 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block px-2 py-2 text-sm text-white/85 hover:text-white">
                {l.label}
              </Link>
            ))}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 px-2 py-2 text-sm text-white/85">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
            {auth ? (
              <div className="border-t border-white/10 pt-2 mt-1 space-y-1">
                <Link href="/account" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2 py-2 text-sm text-white/85 hover:text-white" data-testid="header-mobile-businesses">
                  <LayoutGrid className="h-4 w-4" /> My businesses
                </Link>
                <Link href={dashboardHref(auth.role)} onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2 py-2 text-sm text-white/85 hover:text-white">
                  <User className="h-4 w-4" /> My dashboard
                </Link>
                <button type="button" onClick={() => { setOpen(false); signOut() }}
                  className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-white/85 hover:text-white" data-testid="header-mobile-signout">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            ) : (
              <div className="border-t border-white/10 pt-2 mt-1 space-y-2">
                <Link href="/login" onClick={() => setOpen(false)}
                  className="block px-2 py-2 text-sm text-white/85 hover:text-white" data-testid="header-mobile-signin">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}
                  className="block text-center text-sm font-semibold rounded px-3 py-2 text-white"
                  style={{ background: "var(--site-accent)" }} data-testid="header-mobile-signup">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
