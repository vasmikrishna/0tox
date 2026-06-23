import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

export const metadata: Metadata = {
  metadataBase: new URL(`https://${BASE_DOMAIN}`),
  title: { default: "Site9", template: "%s | Site9" },
  description:
    "Site9 — One Website for Every Business. Launch a professional website in minutes on a free subdomain. No coding, no design skills, no complicated setup.",
  openGraph: {
    type: "website",
    siteName: "Site9",
    title: "Site9 — One Website for Every Business",
    description:
      "Launch a professional website in minutes on a free subdomain. No coding, no design skills, no complicated setup.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Site9 — One Website for Every Business",
    description:
      "Launch a professional website in minutes on a free subdomain. No coding, no design skills, no complicated setup.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
