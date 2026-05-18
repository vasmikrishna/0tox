// Built-in portfolio projects shown on /work.
// Admin-added projects in `portfolio_items` table override / supplement these by slug.
export type SeedProject = {
  slug: string
  title: string
  category: "IT Support" | "Web Services" | "Microsoft 365"
  emoji: string
  bg: string // background colour for card visual (fallback)
  cover?: string // hero photo URL
  shortDescription: string
  longDescription: string
  tags: string[]
  metrics: { label: string; value: string }[]
  live_url?: string
}

export const PORTFOLIO_SEED: SeedProject[] = [
  {
    slug: "carter-plumbing-network",
    title: "Carter Plumbing — Office Network Overhaul",
    category: "IT Support",
    emoji: "🖥️",
    bg: "#1B3A6B",
    cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    shortDescription:
      "Designed and deployed a business-grade office network for a 12-person plumbing business in Melbourne — UniFi firewall, segmented Wi-Fi, NAS file storage, and automated backups.",
    longDescription:
      "Carter Plumbing was running on a consumer-grade router that kept dropping out during busy mornings. Their office of 12 staff needed reliable connectivity for booking software, accounting, and email.\n\nWe replaced the entire network stack — UniFi firewall, managed switch, three Wi-Fi 6 access points — and segmented traffic with VLANs so guest devices can't see the internal file server. A Synology NAS provides shared documents with nightly cloud backups.\n\nResult: zero unplanned downtime in 6 months, file access 4× faster, and IT issues now get resolved remotely in minutes instead of waiting for a technician to drive out.",
    tags: ["IT Infrastructure", "Networking", "Wi-Fi", "Backup"],
    metrics: [
      { label: "Staff", value: "12" },
      { label: "Uptime", value: "99.9%" },
      { label: "Delivered", value: "2 weeks" },
    ],
  },
  {
    slug: "mitchell-bookkeeping-website",
    title: "Mitchell Bookkeeping — Professional Website",
    category: "Web Services",
    emoji: "🌐",
    bg: "#16A34A",
    cover: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80",
    shortDescription:
      "Built a clean 6-page website for a Sydney bookkeeping firm in under a week. Mobile-responsive, SEO-optimised, with contact form and Google Maps.",
    longDescription:
      "Mitchell Bookkeeping had been quoted $15,000+ by Sydney agencies for a basic business website. We delivered a faster, cleaner site in under a week for a fraction of that.\n\nThe site is built on Next.js (instant page loads, perfect for SEO), hosted on Vercel (free, fast, global CDN), and the content is editable through a simple admin panel they own outright. Contact enquiries go straight to their inbox.\n\nResult: 3× increase in enquiry form submissions in the first month, top-3 Google ranking for 'bookkeeper [suburb]', and they update their own content without any ongoing fees.",
    tags: ["Web Services", "Starter", "SEO"],
    metrics: [
      { label: "Pages", value: "6" },
      { label: "Delivered", value: "5 days" },
      { label: "Enquiries", value: "+300%" },
    ],
  },
  {
    slug: "lighthouse-accounting-ms365",
    title: "Lighthouse Accounting — Microsoft 365 Migration",
    category: "Microsoft 365",
    emoji: "☁️",
    bg: "#0078D4",
    cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
    shortDescription:
      "Migrated a 15-person accounting firm from on-premise Exchange to Microsoft 365 Business Premium — zero downtime, full MFA, and conditional access policies.",
    longDescription:
      "Lighthouse Accounting were running their own Exchange server in a cupboard — slow, prone to failure, and a security risk. Migration to Microsoft 365 needed to happen with zero email downtime and full preservation of 8+ years of email history.\n\nWe ran the migration over two weekends: cutover migration for mailboxes, MFA enrolment for every staff member, SharePoint set up to replace their file server, and OneDrive for personal documents. Conditional Access restricts logins to Australian IPs only.\n\nResult: email is faster and more reliable, document collaboration via Teams replaced their email-attachment chaos, and they passed their cyber insurance audit on the first try.",
    tags: ["Microsoft 365", "Email Migration", "Security", "Teams"],
    metrics: [
      { label: "Mailboxes", value: "15" },
      { label: "Downtime", value: "0 min" },
      { label: "Data migrated", value: "240 GB" },
    ],
  },
  {
    slug: "pho-palace-website",
    title: "Pho Palace — Restaurant Website & Online Menu",
    category: "Web Services",
    emoji: "🍜",
    bg: "#DC2626",
    cover: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    shortDescription:
      "Mobile-first restaurant site with online menu, reservation form, location map, and Instagram feed. Loads in under 1 second on 4G mobile.",
    longDescription:
      "Pho Palace, a popular Vietnamese restaurant, was relying entirely on Facebook for customers to find their menu and opening hours. They wanted a proper website without the Squarespace lock-in.\n\nWe built them a fast, mobile-first site with a beautiful photo gallery, the full menu (easily editable), reservation form straight to their email, Google Maps embed, and Instagram feed integration. Under 200KB on first load — important for diners on patchy mobile data.\n\nResult: bookings via the website now exceed phone bookings, Google traffic up 5×, and the owner can update the menu in 60 seconds from her phone.",
    tags: ["Web Services", "Standard", "Mobile-first", "Hospitality"],
    metrics: [
      { label: "Load time", value: "<1s" },
      { label: "Delivered", value: "1 week" },
      { label: "Bookings", value: "+250%" },
    ],
  },
  {
    slug: "trades-club-portal",
    title: "TradesClub — Custom Member Portal Web App",
    category: "Web Services",
    emoji: "⚡",
    bg: "#7C3AED",
    cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    shortDescription:
      "Full-stack web app with member login, Stripe-powered subscriptions, document library, event RSVP, and admin dashboard for a trades industry association.",
    longDescription:
      "TradesClub had 200+ members managed via spreadsheets and email. They needed a proper member portal: login, profile management, paid membership tiers via Stripe, access to industry documents, RSVP for events, and an admin view for the office.\n\nWe built the whole thing as a custom Next.js + Supabase application. Members self-serve everything — renew their membership, download certificates, RSVP to events — and the admin dashboard gives the office full visibility and the ability to push announcements.\n\nResult: admin team saved 15+ hours per week on member admin, payment failures dropped to zero thanks to Stripe smart retries, and member satisfaction scores improved noticeably.",
    tags: ["Web Services", "Pro", "Web App", "Stripe", "Authentication"],
    metrics: [
      { label: "Members", value: "200+" },
      { label: "Built in", value: "8 weeks" },
      { label: "Admin time saved", value: "15h/wk" },
    ],
  },
  {
    slug: "coastal-retail-managed-it",
    title: "Coastal Retail Group — Ongoing Managed IT",
    category: "IT Support",
    emoji: "🛒",
    bg: "#0891B2",
    cover: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    shortDescription:
      "Comprehensive managed IT support for a 4-location retail chain: 24/7 monitoring, POS maintenance, central endpoint security, and offsite encrypted backups.",
    longDescription:
      "Coastal Retail Group runs four boutique stores along the NSW coast. Each store has a POS terminal, EFTPOS machine, security cameras, and back-office laptop. When IT goes down, sales stop.\n\nWe took over their IT as a fully managed service: 24/7 monitoring of every POS terminal, automated alerts when anything goes offline, central endpoint security across all devices, and a single phone number staff call for any issue. Offsite encrypted backups mean a dead store PC is up and running with their data in under 4 hours.\n\nResult: average issue resolution dropped from 2 days to 90 minutes, zero data loss incidents in 14 months, and the owner finally took a 3-week holiday without a single IT phone call.",
    tags: ["IT Infrastructure", "Managed Support", "Retail", "Help Desk"],
    metrics: [
      { label: "Locations", value: "4" },
      { label: "Response", value: "90 min" },
      { label: "Data loss", value: "Zero" },
    ],
  },
]

export function getProjectBySlug(slug: string): SeedProject | undefined {
  return PORTFOLIO_SEED.find(p => p.slug === slug)
}
