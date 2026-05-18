import { createClient } from "@/lib/supabase/server"

export type SiteSettings = Record<string, string>

const DEFAULTS: SiteSettings = {
  theme_primary: "#1B3A6B",
  theme_secondary: "#ffffff",
  theme_accent: "#16A34A",
  theme_bg: "#f8f9fa",
  theme_text: "#1a1a2e",
  site_name: "0→X IT Services",
  site_tagline: "Local IT support and digital services for Australian businesses",
  contact_phone: "+61 400 000 000",
  contact_email: "hello@0tox.com",
  contact_address: "Australia — Remote-first, serving clients nationwide",
  contact_linkedin: "https://linkedin.com",
  hero_headline: "Reliable IT Support for Australian Businesses",
  hero_sub: "From managed IT infrastructure to professional websites and Microsoft 365 — we handle your tech so you can focus on running your business.",
  hero_cta_primary: "Talk to us",
  hero_cta_secondary: "See our services",
  about_heading: "About 0→X",
  about_intro: "We're a small Australian team helping local businesses get the tech they need — without the big agency price tag. Between us we cover IT infrastructure, web development, and Microsoft 365 deployments. No lock-in contracts, no jargon, no surprises.",
  about_stat_1_num: "50+", about_stat_1_label: "Clients served",
  about_stat_2_num: "3–5", about_stat_2_label: "Days to deliver a Starter site",
  about_stat_3_num: "100%", about_stat_3_label: "Code ownership — yours",
  about_stat_4_num: "0", about_stat_4_label: "Agency overhead",
  // Team — photos default to UI Avatars (initials on theme colour). Replace with real photo URLs from /admin/website.
  team_heading: "Meet the team",
  team_sub: "A small crew of Australian tech professionals — each focused on the work they do best.",
  team_1_name: "Vamsi Krishna",
  team_1_role: "Founder · Full-stack Developer",
  team_1_bio: "Builds the websites and web apps. 10+ years writing production code, from startups to enterprise. Lives and breathes Next.js, React, and clean code.",
  team_1_photo: "https://ui-avatars.com/api/?name=Vamsi+Krishna&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_1_linkedin: "https://www.linkedin.com/in/vkreddy001/",
  team_2_name: "Arjun Patel",
  team_2_role: "IT Infrastructure Lead",
  team_2_bio: "Designs and deploys office networks, servers, and security. Microsoft and UniFi certified, with deep experience supporting Australian SMBs from cafés to accounting firms.",
  team_2_photo: "https://ui-avatars.com/api/?name=Arjun+Patel&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_2_linkedin: "",
  team_3_name: "Sarah Nguyen",
  team_3_role: "Microsoft 365 Specialist",
  team_3_bio: "Handles Microsoft 365 migrations, Teams rollouts, and security configurations. Former Microsoft partner consultant — knows the M365 stack inside out.",
  team_3_photo: "https://ui-avatars.com/api/?name=Sarah+Nguyen&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_3_linkedin: "",
  team_4_name: "James Wilson",
  team_4_role: "Client Success & Support",
  team_4_bio: "Your first point of contact. Answers the phone, scopes projects, and makes sure work gets delivered on time. Speaks plain English — no tech jargon, ever.",
  team_4_photo: "https://ui-avatars.com/api/?name=James+Wilson&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_4_linkedin: "",
  services_it_title: "IT Support & Infrastructure",
  services_it_tagline: "Reliable tech support for your whole business",
  services_it_desc: "We set up and manage your IT so it just works — servers, networking, internet, hardware, security, and ongoing help desk support. Local, fast, no technobabble.",
  services_it_features: "Managed help desk (remote & on-site)|Server setup and maintenance|NBN, networking & Wi-Fi setup|Hardware procurement & setup|Data backup & disaster recovery|Endpoint security & antivirus|IT consulting & strategy",
  services_web_title: "Web Services",
  services_web_tagline: "Professional websites that work as hard as you do",
  services_web_desc: "From a simple 5-page business site to a full web application with user login and payments — we build clean, fast websites that represent your brand and get results.",
  services_web_features: "Business websites (5–15+ pages)|E-commerce & online stores|Web applications & portals|Mobile-responsive design|SEO & performance optimisation|Ongoing maintenance & hosting support",
  services_ms365_title: "Microsoft 365",
  services_ms365_tagline: "Get your whole team working in the cloud",
  services_ms365_desc: "We set up, migrate, and support your Microsoft 365 environment — from professional email and Teams to SharePoint and OneDrive. Perfect for small teams moving to the cloud.",
  services_ms365_features: "Microsoft 365 setup & licensing|Email migration (Exchange Online)|Microsoft Teams & SharePoint|OneDrive & file sharing setup|Security & compliance configuration|Staff training & ongoing support",
  testimonial_1_name: "James Carter", testimonial_1_role: "Owner, Carter Plumbing",
  testimonial_1_text: "Vamsi set up our whole office network and got us onto Microsoft 365. Everything just works now. Honest pricing, no runaround.",
  testimonial_2_name: "Sarah Mitchell", testimonial_2_role: "Director, Mitchell Bookkeeping",
  testimonial_2_text: "They built our website in under a week and it looks better than anything the big agencies quoted us. Highly recommend.",
  testimonial_3_name: "David Nguyen", testimonial_3_role: "Owner, Pho Palace Restaurant",
  testimonial_3_text: "Finally a tech company that speaks plain English. They sorted our IT problems quickly and at a fair price.",
  footer_tagline: "Local IT support and digital services for Australian businesses.",
  v1_active: "true",
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createClient()
    const { data } = await supabase.from("site_settings").select("key, value")
    if (!data || data.length === 0) return DEFAULTS
    const settings: SiteSettings = { ...DEFAULTS }
    for (const row of data as { key: string; value: string | null }[]) {
      if (row.key && row.value !== null) settings[row.key] = row.value
    }
    return settings
  } catch {
    return DEFAULTS
  }
}

export function s(settings: SiteSettings, key: string): string {
  return settings[key] ?? DEFAULTS[key] ?? ""
}

export function features(settings: SiteSettings, key: string): string[] {
  return (s(settings, key) || "").split("|").filter(Boolean)
}
