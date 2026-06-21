import { createClient } from "@/lib/supabase/server"

export type SiteSettings = Record<string, string>

const DEFAULTS: SiteSettings = {
  theme_primary: "#1B3A6B",
  theme_secondary: "#ffffff",
  theme_accent: "#16A34A",
  theme_bg: "#f8f9fa",
  theme_text: "#1a1a2e",
  site_name: "Site9",
  site_tagline: "One Website for Every Business",
  contact_phone: "",
  contact_email: "hello@site9.in",
  contact_address: "Online — serving businesses everywhere",
  contact_linkedin: "https://linkedin.com",
  hero_headline: "One Website for Every Business",
  hero_sub: "Whether you're a local shop, freelancer, photographer, restaurant, salon, PG owner, consultant, or startup — Site9 makes it simple, affordable, and accessible to get your business online. No coding. No design skills. No complicated setup.",
  hero_cta_primary: "Create your website",
  hero_cta_secondary: "See examples",
  about_heading: "About Site9",
  about_intro: "Our vision is to bring every business online. We imagine a future where having a website is as common as having a phone number, email, or WhatsApp account. Millions of businesses still rely only on social media, WhatsApp, or word of mouth — and building a website is too often expensive, slow, and technically complex. Site9 removes the barriers. Getting online shouldn't be complicated, and getting a website shouldn't require a developer.",
  about_stat_1_num: "Minutes", about_stat_1_label: "to launch",
  about_stat_2_num: "No code", about_stat_2_label: "needed",
  about_stat_3_num: "Free", about_stat_3_label: "subdomain",
  about_stat_4_num: "Any device", about_stat_4_label: "responsive",
  // Team — photos default to UI Avatars (initials on theme colour). Replace with real photo URLs.
  team_heading: "Meet the team",
  team_sub: "A small team building the simplest way to get your business online.",
  team_1_name: "Vamsi Krishna",
  team_1_role: "Founder",
  team_1_bio: "Started Site9 to bring every business online. Believes a website should be as easy to get as a phone number — no coding, no agencies, no barriers.",
  team_1_photo: "https://ui-avatars.com/api/?name=Vamsi+Krishna&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_1_linkedin: "https://www.linkedin.com/in/vkreddy001/",
  team_2_name: "Arjun Patel",
  team_2_role: "Product",
  team_2_bio: "Shapes the Site9 builder so anyone can launch a professional website in minutes. Obsessed with making setup effortless for small businesses.",
  team_2_photo: "https://ui-avatars.com/api/?name=Arjun+Patel&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_2_linkedin: "",
  team_3_name: "Sarah Nguyen",
  team_3_role: "Design",
  team_3_bio: "Designs the templates and themes that make every Site9 website look polished and professional — on any device, right out of the box.",
  team_3_photo: "https://ui-avatars.com/api/?name=Sarah+Nguyen&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_3_linkedin: "",
  team_4_name: "James Wilson",
  team_4_role: "Support",
  team_4_bio: "Your first point of contact. Helps business owners get online and answers questions in plain English — no tech jargon, ever.",
  team_4_photo: "https://ui-avatars.com/api/?name=James+Wilson&size=400&background=1B3A6B&color=fff&bold=true&format=png",
  team_4_linkedin: "",
  services_it_title: "Launch in minutes",
  services_it_tagline: "Go live before lunch",
  services_it_desc: "Enter your business info and launch a professional website in minutes — no coding, no design skills, no complicated setup. Your business online, on a free subdomain.",
  services_it_features: "Instant website creation|Free yourbusiness.site9.in subdomain|Mobile responsive|No coding or design skills",
  services_web_title: "Show off your business",
  services_web_tagline: "Everything your customers need to know",
  services_web_desc: "Tell your story, show your work, and make it easy for customers to reach you — all from one simple business profile with everything built in.",
  services_web_features: "Business profile (services, hours, address)|Image gallery|WhatsApp integration|Contact forms & lead capture|Google Maps",
  services_ms365_title: "Get found & grow",
  services_ms365_tagline: "Turn your site into a growth engine",
  services_ms365_desc: "Get discovered on Google, create content with AI, and track your visitors — with the option to bring your own domain and secure managed hosting.",
  services_ms365_features: "SEO ready|AI content generation|Analytics dashboard|Custom domain support|Secure managed hosting",
  testimonial_1_name: "Priya Sharma", testimonial_1_role: "Owner, Brew & Bean Café",
  testimonial_1_text: "I had cafe.site9.in live the same afternoon. No developer, no agency — just my menu, hours, and WhatsApp, all online. Customers find us on Google now.",
  testimonial_2_name: "Aisha Khan", testimonial_2_role: "Owner, Glow Salon",
  testimonial_2_text: "Site9 made it so simple. salon.site9.in has my services, gallery, and a booking enquiry form. It looks professional and cost me nothing to start.",
  testimonial_3_name: "Rahul Verma", testimonial_3_role: "Freelance Photographer",
  testimonial_3_text: "My portfolio at photographer.site9.in took minutes to set up and works perfectly on phones. New clients reach me straight from the contact form.",
  footer_tagline: "One Website for Every Business.",
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
