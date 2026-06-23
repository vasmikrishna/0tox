export interface TemplateDef {
  name: string
  slug: string
  description: string
  category: string
  industry: string
  style: string
  tags: string[]
  preview_url: string
}

const UNSPLASH: Record<string, string> = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=640&q=70",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=640&q=70",
  photography: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=640&q=70",
  professional: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=70",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&q=70",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=70",
  healthcare: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&q=70",
  consulting: "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=640&q=70",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=70",
  education: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=70",
}

export const TEMPLATE_DEFINITIONS: TemplateDef[] = [
  // ─── Restaurant (10) ────────────────────────────────
  { name: "Modern Bistro", slug: "modern-bistro", description: "Clean, modern restaurant site with menu and reservation CTA", category: "business", industry: "restaurant", style: "modern", tags: ["food", "dining", "menu"], preview_url: UNSPLASH.restaurant },
  { name: "Dark Steakhouse", slug: "dark-steakhouse", description: "Dark luxury steakhouse with moody imagery and gold accents", category: "landing", industry: "restaurant", style: "dark", tags: ["food", "luxury", "steak"], preview_url: UNSPLASH.restaurant },
  { name: "Warm Café", slug: "warm-cafe", description: "Cozy café with warm earth tones and serif headings", category: "business", industry: "restaurant", style: "warm", tags: ["cafe", "coffee", "bakery"], preview_url: UNSPLASH.restaurant },
  { name: "Minimal Sushi Bar", slug: "minimal-sushi-bar", description: "Minimalist Japanese restaurant with whitespace and clean lines", category: "business", industry: "restaurant", style: "minimal", tags: ["sushi", "japanese", "clean"], preview_url: UNSPLASH.restaurant },
  { name: "Bold BBQ Joint", slug: "bold-bbq-joint", description: "Bold, punchy BBQ restaurant with big typography and smoky feel", category: "landing", industry: "restaurant", style: "bold", tags: ["bbq", "grill", "smoky"], preview_url: UNSPLASH.restaurant },
  { name: "Elegant Fine Dining", slug: "elegant-fine-dining", description: "Upscale fine dining with elegant serif fonts and subtle animations", category: "business", industry: "restaurant", style: "elegant", tags: ["fine-dining", "upscale", "elegant"], preview_url: UNSPLASH.restaurant },
  { name: "Playful Pizza Place", slug: "playful-pizza-place", description: "Fun, colorful pizza restaurant with playful illustrations and bright colors", category: "business", industry: "restaurant", style: "playful", tags: ["pizza", "fun", "family"], preview_url: UNSPLASH.restaurant },
  { name: "Corporate Catering", slug: "corporate-catering", description: "Professional catering service site with clean corporate look", category: "business", industry: "restaurant", style: "corporate", tags: ["catering", "events", "corporate"], preview_url: UNSPLASH.restaurant },
  { name: "Food Truck Landing", slug: "food-truck-landing", description: "Single-page food truck site with location map and menu", category: "landing", industry: "restaurant", style: "bold", tags: ["food-truck", "street-food", "mobile"], preview_url: UNSPLASH.restaurant },
  { name: "Vegan Kitchen", slug: "vegan-kitchen", description: "Fresh, green-themed vegan restaurant with organic feel", category: "business", industry: "restaurant", style: "modern", tags: ["vegan", "organic", "healthy"], preview_url: UNSPLASH.restaurant },

  // ─── Salon & Beauty (10) ────────────────────────────
  { name: "Modern Beauty Studio", slug: "modern-beauty-studio", description: "Contemporary beauty salon with sleek gallery and booking CTA", category: "business", industry: "salon", style: "modern", tags: ["beauty", "salon", "hair"], preview_url: UNSPLASH.salon },
  { name: "Dark Luxury Spa", slug: "dark-luxury-spa", description: "Dark, luxurious spa site with gold accents and serene imagery", category: "landing", industry: "salon", style: "dark", tags: ["spa", "luxury", "wellness"], preview_url: UNSPLASH.salon },
  { name: "Warm Hair Salon", slug: "warm-hair-salon", description: "Warm, inviting hair salon with friendly vibes and portfolio", category: "business", industry: "salon", style: "warm", tags: ["hair", "stylists", "cuts"], preview_url: UNSPLASH.salon },
  { name: "Minimal Nail Studio", slug: "minimal-nail-studio", description: "Minimal, airy nail salon design with pastel tones", category: "business", industry: "salon", style: "minimal", tags: ["nails", "manicure", "pedicure"], preview_url: UNSPLASH.salon },
  { name: "Bold Barbershop", slug: "bold-barbershop", description: "Bold barbershop with strong typography and masculine energy", category: "landing", industry: "salon", style: "bold", tags: ["barber", "men", "grooming"], preview_url: UNSPLASH.salon },
  { name: "Elegant Bridal Salon", slug: "elegant-bridal-salon", description: "Elegant bridal makeup and hair salon with romantic styling", category: "business", industry: "salon", style: "elegant", tags: ["bridal", "wedding", "makeup"], preview_url: UNSPLASH.salon },
  { name: "Playful Kids Salon", slug: "playful-kids-salon", description: "Playful, colorful kids hair salon with fun design", category: "business", industry: "salon", style: "playful", tags: ["kids", "family", "fun"], preview_url: UNSPLASH.salon },
  { name: "Corporate Wellness Spa", slug: "corporate-wellness-spa", description: "Corporate-feeling wellness center with professional tone", category: "business", industry: "salon", style: "corporate", tags: ["wellness", "corporate", "spa"], preview_url: UNSPLASH.salon },
  { name: "Lash & Brow Studio", slug: "lash-brow-studio", description: "Focused lash and brow studio with before/after gallery", category: "portfolio", industry: "salon", style: "modern", tags: ["lashes", "brows", "beauty"], preview_url: UNSPLASH.salon },
  { name: "Tattoo Parlor", slug: "tattoo-parlor", description: "Edgy tattoo parlor with dark theme and artist portfolio", category: "portfolio", industry: "salon", style: "dark", tags: ["tattoo", "ink", "art"], preview_url: UNSPLASH.salon },

  // ─── Photography (10) ──────────────────────────────
  { name: "Modern Photo Portfolio", slug: "modern-photo-portfolio", description: "Clean photographer portfolio with full-bleed images", category: "portfolio", industry: "photography", style: "modern", tags: ["photographer", "portfolio", "gallery"], preview_url: UNSPLASH.photography },
  { name: "Dark Moody Photos", slug: "dark-moody-photos", description: "Dark, moody photography portfolio with cinematic feel", category: "portfolio", industry: "photography", style: "dark", tags: ["moody", "cinematic", "dark"], preview_url: UNSPLASH.photography },
  { name: "Warm Wedding Photos", slug: "warm-wedding-photos", description: "Warm-toned wedding photography portfolio with romantic feel", category: "portfolio", industry: "photography", style: "warm", tags: ["wedding", "romance", "love"], preview_url: UNSPLASH.photography },
  { name: "Minimal Photo Grid", slug: "minimal-photo-grid", description: "Ultra-minimal grid-based photography portfolio", category: "portfolio", industry: "photography", style: "minimal", tags: ["minimal", "grid", "clean"], preview_url: UNSPLASH.photography },
  { name: "Bold Event Photos", slug: "bold-event-photos", description: "Bold event and concert photography showcase", category: "portfolio", industry: "photography", style: "bold", tags: ["events", "concerts", "live"], preview_url: UNSPLASH.photography },
  { name: "Elegant Portrait Studio", slug: "elegant-portrait-studio", description: "Elegant portrait photography studio with refined design", category: "portfolio", industry: "photography", style: "elegant", tags: ["portrait", "studio", "headshot"], preview_url: UNSPLASH.photography },
  { name: "Newborn Photography", slug: "newborn-photography", description: "Soft, gentle newborn photography site with pastel palette", category: "portfolio", industry: "photography", style: "warm", tags: ["newborn", "baby", "family"], preview_url: UNSPLASH.photography },
  { name: "Real Estate Photos", slug: "real-estate-photos", description: "Professional real estate photography portfolio", category: "portfolio", industry: "photography", style: "corporate", tags: ["real-estate", "architecture", "interiors"], preview_url: UNSPLASH.photography },
  { name: "Travel Photography", slug: "travel-photography", description: "Adventurous travel photography blog-style portfolio", category: "blog", industry: "photography", style: "modern", tags: ["travel", "adventure", "landscape"], preview_url: UNSPLASH.photography },
  { name: "Product Photography", slug: "product-photography", description: "Clean product photography showcase for commercial work", category: "portfolio", industry: "photography", style: "minimal", tags: ["product", "commercial", "ecommerce"], preview_url: UNSPLASH.photography },

  // ─── Professional Services (10) ────────────────────
  { name: "Modern Law Firm", slug: "modern-law-firm", description: "Modern law firm site with trust signals and practice areas", category: "business", industry: "professional", style: "modern", tags: ["law", "legal", "attorney"], preview_url: UNSPLASH.professional },
  { name: "Dark Architect Studio", slug: "dark-architect-studio", description: "Dark, dramatic architecture firm with project gallery", category: "portfolio", industry: "professional", style: "dark", tags: ["architecture", "design", "projects"], preview_url: UNSPLASH.professional },
  { name: "Warm Therapist", slug: "warm-therapist", description: "Warm, approachable therapist site with calming design", category: "business", industry: "professional", style: "warm", tags: ["therapy", "counseling", "mental-health"], preview_url: UNSPLASH.professional },
  { name: "Minimal Consultant", slug: "minimal-consultant", description: "Minimal consultant site focused on credibility and conversion", category: "landing", industry: "professional", style: "minimal", tags: ["consulting", "strategy", "business"], preview_url: UNSPLASH.professional },
  { name: "Bold Accountant", slug: "bold-accountant", description: "Bold accounting firm with clear service tiers and trust", category: "business", industry: "professional", style: "bold", tags: ["accounting", "tax", "finance"], preview_url: UNSPLASH.professional },
  { name: "Elegant Wedding Planner", slug: "elegant-wedding-planner", description: "Elegant wedding planner with romantic gallery and testimonials", category: "business", industry: "professional", style: "elegant", tags: ["wedding", "planner", "events"], preview_url: UNSPLASH.professional },
  { name: "Playful Freelancer", slug: "playful-freelancer", description: "Fun, creative freelancer personal brand page", category: "personal", industry: "professional", style: "playful", tags: ["freelance", "creative", "portfolio"], preview_url: UNSPLASH.professional },
  { name: "Corporate Advisory", slug: "corporate-advisory", description: "Polished corporate advisory firm with executive presence", category: "business", industry: "professional", style: "corporate", tags: ["advisory", "corporate", "executive"], preview_url: UNSPLASH.professional },
  { name: "Insurance Agency", slug: "insurance-agency", description: "Trustworthy insurance agency site with plan comparison", category: "business", industry: "professional", style: "modern", tags: ["insurance", "coverage", "protection"], preview_url: UNSPLASH.professional },
  { name: "Real Estate Agent", slug: "real-estate-agent", description: "Professional real estate agent site with featured listings", category: "business", industry: "professional", style: "corporate", tags: ["real-estate", "agent", "listings"], preview_url: UNSPLASH.professional },

  // ─── Retail & Shop (10) ────────────────────────────
  { name: "Modern Boutique", slug: "modern-boutique", description: "Modern fashion boutique with featured products and lookbook", category: "ecommerce", industry: "retail", style: "modern", tags: ["fashion", "boutique", "clothing"], preview_url: UNSPLASH.retail },
  { name: "Dark Streetwear", slug: "dark-streetwear", description: "Dark streetwear brand with bold imagery and urban feel", category: "ecommerce", industry: "retail", style: "dark", tags: ["streetwear", "urban", "fashion"], preview_url: UNSPLASH.retail },
  { name: "Warm Artisan Shop", slug: "warm-artisan-shop", description: "Warm handmade goods shop with artisan craftsmanship vibe", category: "ecommerce", industry: "retail", style: "warm", tags: ["artisan", "handmade", "crafts"], preview_url: UNSPLASH.retail },
  { name: "Minimal Jewelry", slug: "minimal-jewelry", description: "Minimal jewelry brand with elegant product presentation", category: "ecommerce", industry: "retail", style: "minimal", tags: ["jewelry", "accessories", "minimal"], preview_url: UNSPLASH.retail },
  { name: "Bold Sneaker Store", slug: "bold-sneaker-store", description: "Bold sneaker store with dynamic product showcase", category: "ecommerce", industry: "retail", style: "bold", tags: ["sneakers", "shoes", "sportswear"], preview_url: UNSPLASH.retail },
  { name: "Elegant Home Decor", slug: "elegant-home-decor", description: "Elegant home decor shop with curated collection display", category: "ecommerce", industry: "retail", style: "elegant", tags: ["home", "decor", "interior"], preview_url: UNSPLASH.retail },
  { name: "Playful Pet Shop", slug: "playful-pet-shop", description: "Playful pet shop with cute imagery and fun design", category: "ecommerce", industry: "retail", style: "playful", tags: ["pets", "animals", "supplies"], preview_url: UNSPLASH.retail },
  { name: "Corporate B2B Store", slug: "corporate-b2b-store", description: "Professional B2B wholesale store with catalog layout", category: "ecommerce", industry: "retail", style: "corporate", tags: ["b2b", "wholesale", "catalog"], preview_url: UNSPLASH.retail },
  { name: "Flower Shop", slug: "flower-shop", description: "Beautiful flower shop with seasonal arrangements and delivery", category: "ecommerce", industry: "retail", style: "warm", tags: ["flowers", "florist", "gifts"], preview_url: UNSPLASH.retail },
  { name: "Bookstore", slug: "bookstore", description: "Cozy bookstore with curated picks and reading atmosphere", category: "ecommerce", industry: "retail", style: "warm", tags: ["books", "reading", "literature"], preview_url: UNSPLASH.retail },

  // ─── Fitness (10) ──────────────────────────────────
  { name: "Modern Gym", slug: "modern-gym", description: "Modern gym with class schedule and membership tiers", category: "business", industry: "fitness", style: "modern", tags: ["gym", "fitness", "workout"], preview_url: UNSPLASH.fitness },
  { name: "Dark CrossFit Box", slug: "dark-crossfit-box", description: "Dark, intense CrossFit gym with gritty photography", category: "landing", industry: "fitness", style: "dark", tags: ["crossfit", "strength", "training"], preview_url: UNSPLASH.fitness },
  { name: "Warm Yoga Studio", slug: "warm-yoga-studio", description: "Warm, calming yoga studio with class schedule and retreat info", category: "business", industry: "fitness", style: "warm", tags: ["yoga", "meditation", "wellness"], preview_url: UNSPLASH.fitness },
  { name: "Minimal Pilates", slug: "minimal-pilates", description: "Minimal pilates studio with clean design and booking", category: "business", industry: "fitness", style: "minimal", tags: ["pilates", "core", "studio"], preview_url: UNSPLASH.fitness },
  { name: "Bold MMA Gym", slug: "bold-mma-gym", description: "Bold martial arts gym with fighter profiles and class info", category: "landing", industry: "fitness", style: "bold", tags: ["mma", "boxing", "martial-arts"], preview_url: UNSPLASH.fitness },
  { name: "Elegant Dance Academy", slug: "elegant-dance-academy", description: "Elegant dance studio with class schedule and performance gallery", category: "business", industry: "fitness", style: "elegant", tags: ["dance", "ballet", "academy"], preview_url: UNSPLASH.fitness },
  { name: "Playful Kids Sports", slug: "playful-kids-sports", description: "Fun kids sports academy with colorful design", category: "business", industry: "fitness", style: "playful", tags: ["kids", "sports", "academy"], preview_url: UNSPLASH.fitness },
  { name: "Corporate Wellness Program", slug: "corporate-wellness-program", description: "Corporate wellness program landing page for companies", category: "landing", industry: "fitness", style: "corporate", tags: ["corporate", "wellness", "employee"], preview_url: UNSPLASH.fitness },
  { name: "Personal Trainer", slug: "personal-trainer", description: "Personal trainer landing with transformation gallery and pricing", category: "personal", industry: "fitness", style: "bold", tags: ["trainer", "coaching", "transformation"], preview_url: UNSPLASH.fitness },
  { name: "Swimming Academy", slug: "swimming-academy", description: "Swimming school with class levels and pool facilities", category: "business", industry: "fitness", style: "modern", tags: ["swimming", "pool", "lessons"], preview_url: UNSPLASH.fitness },

  // ─── Healthcare (10) ──────────────────────────────
  { name: "Modern Dental Clinic", slug: "modern-dental-clinic", description: "Modern dental clinic with services and appointment booking", category: "business", industry: "healthcare", style: "modern", tags: ["dental", "dentist", "oral-care"], preview_url: UNSPLASH.healthcare },
  { name: "Dark Aesthetics Clinic", slug: "dark-aesthetics-clinic", description: "Dark, premium aesthetics and dermatology clinic", category: "business", industry: "healthcare", style: "dark", tags: ["aesthetics", "dermatology", "skincare"], preview_url: UNSPLASH.healthcare },
  { name: "Warm Pediatrician", slug: "warm-pediatrician", description: "Warm, family-friendly pediatric practice", category: "business", industry: "healthcare", style: "warm", tags: ["pediatric", "children", "family"], preview_url: UNSPLASH.healthcare },
  { name: "Minimal Physio Clinic", slug: "minimal-physio-clinic", description: "Minimal physiotherapy clinic with treatment info", category: "business", industry: "healthcare", style: "minimal", tags: ["physio", "rehab", "therapy"], preview_url: UNSPLASH.healthcare },
  { name: "Bold Chiropractic", slug: "bold-chiropractic", description: "Bold chiropractic clinic with transformation stories", category: "landing", industry: "healthcare", style: "bold", tags: ["chiropractic", "spine", "pain-relief"], preview_url: UNSPLASH.healthcare },
  { name: "Elegant Eye Clinic", slug: "elegant-eye-clinic", description: "Elegant eye care clinic with vision services", category: "business", industry: "healthcare", style: "elegant", tags: ["eye-care", "optometry", "vision"], preview_url: UNSPLASH.healthcare },
  { name: "Pharmacy", slug: "pharmacy", description: "Clean pharmacy site with services and health tips", category: "business", industry: "healthcare", style: "modern", tags: ["pharmacy", "medicine", "health"], preview_url: UNSPLASH.healthcare },
  { name: "Corporate Health Startup", slug: "corporate-health-startup", description: "Corporate healthtech startup landing page", category: "saas", industry: "healthcare", style: "corporate", tags: ["healthtech", "startup", "platform"], preview_url: UNSPLASH.healthcare },
  { name: "Mental Health Practice", slug: "mental-health-practice", description: "Calming mental health practice with resources and booking", category: "business", industry: "healthcare", style: "warm", tags: ["mental-health", "psychology", "counseling"], preview_url: UNSPLASH.healthcare },
  { name: "Veterinary Clinic", slug: "veterinary-clinic", description: "Friendly veterinary clinic with pet care services", category: "business", industry: "healthcare", style: "playful", tags: ["vet", "animals", "pet-care"], preview_url: UNSPLASH.healthcare },

  // ─── Technology (10) ──────────────────────────────
  { name: "Modern SaaS Landing", slug: "modern-saas-landing", description: "Modern SaaS product landing page with feature grid", category: "saas", industry: "technology", style: "modern", tags: ["saas", "software", "product"], preview_url: UNSPLASH.technology },
  { name: "Dark Dev Agency", slug: "dark-dev-agency", description: "Dark developer agency with project showcase and tech stack", category: "business", industry: "technology", style: "dark", tags: ["agency", "development", "code"], preview_url: UNSPLASH.technology },
  { name: "Minimal App Landing", slug: "minimal-app-landing", description: "Minimal mobile app landing page with screenshots", category: "landing", industry: "technology", style: "minimal", tags: ["app", "mobile", "startup"], preview_url: UNSPLASH.technology },
  { name: "Bold AI Startup", slug: "bold-ai-startup", description: "Bold AI/ML startup landing with gradient hero and demos", category: "saas", industry: "technology", style: "bold", tags: ["ai", "ml", "startup"], preview_url: UNSPLASH.technology },
  { name: "Elegant Tech Consulting", slug: "elegant-tech-consulting", description: "Elegant technology consulting firm page", category: "business", industry: "technology", style: "elegant", tags: ["consulting", "enterprise", "solutions"], preview_url: UNSPLASH.technology },
  { name: "Playful EdTech", slug: "playful-edtech", description: "Playful edtech platform with learning features", category: "saas", industry: "technology", style: "playful", tags: ["edtech", "learning", "platform"], preview_url: UNSPLASH.technology },
  { name: "Corporate IT Services", slug: "corporate-it-services", description: "Corporate IT services company with managed solutions", category: "business", industry: "technology", style: "corporate", tags: ["it", "managed-services", "enterprise"], preview_url: UNSPLASH.technology },
  { name: "API Product Page", slug: "api-product-page", description: "Developer-focused API product page with docs and pricing", category: "saas", industry: "technology", style: "dark", tags: ["api", "developer", "platform"], preview_url: UNSPLASH.technology },
  { name: "Cybersecurity Firm", slug: "cybersecurity-firm", description: "Cybersecurity company with threat stats and service tiers", category: "business", industry: "technology", style: "dark", tags: ["security", "cyber", "protection"], preview_url: UNSPLASH.technology },
  { name: "Web Design Agency", slug: "web-design-agency", description: "Creative web design agency with colorful portfolio", category: "portfolio", industry: "technology", style: "modern", tags: ["design", "agency", "creative"], preview_url: UNSPLASH.technology },

  // ─── Consulting (10) ──────────────────────────────
  { name: "Modern Strategy Firm", slug: "modern-strategy-firm", description: "Modern management consulting firm with case studies", category: "business", industry: "consulting", style: "modern", tags: ["strategy", "management", "consulting"], preview_url: UNSPLASH.consulting },
  { name: "Dark Executive Coach", slug: "dark-executive-coach", description: "Dark, premium executive coaching brand", category: "personal", industry: "consulting", style: "dark", tags: ["coaching", "executive", "leadership"], preview_url: UNSPLASH.consulting },
  { name: "Warm Life Coach", slug: "warm-life-coach", description: "Warm, personal life coaching site with testimonials", category: "personal", industry: "consulting", style: "warm", tags: ["life-coach", "mindset", "growth"], preview_url: UNSPLASH.consulting },
  { name: "Minimal Marketing Agency", slug: "minimal-marketing-agency", description: "Minimal digital marketing agency with results focus", category: "business", industry: "consulting", style: "minimal", tags: ["marketing", "digital", "seo"], preview_url: UNSPLASH.consulting },
  { name: "Bold Growth Agency", slug: "bold-growth-agency", description: "Bold growth hacking agency with metrics and case studies", category: "landing", industry: "consulting", style: "bold", tags: ["growth", "performance", "results"], preview_url: UNSPLASH.consulting },
  { name: "Elegant HR Consulting", slug: "elegant-hr-consulting", description: "Elegant HR consulting firm with service overview", category: "business", industry: "consulting", style: "elegant", tags: ["hr", "talent", "people"], preview_url: UNSPLASH.consulting },
  { name: "Financial Advisor", slug: "financial-advisor", description: "Professional financial advisor site with services and trust", category: "business", industry: "consulting", style: "corporate", tags: ["finance", "wealth", "advisor"], preview_url: UNSPLASH.consulting },
  { name: "PR Agency", slug: "pr-agency", description: "Dynamic PR and communications agency page", category: "business", industry: "consulting", style: "modern", tags: ["pr", "communications", "media"], preview_url: UNSPLASH.consulting },
  { name: "Sustainability Consultant", slug: "sustainability-consultant", description: "Green sustainability consulting with eco-friendly design", category: "business", industry: "consulting", style: "warm", tags: ["sustainability", "green", "eco"], preview_url: UNSPLASH.consulting },
  { name: "Innovation Lab", slug: "innovation-lab", description: "Innovation lab / incubator landing with programs and alumni", category: "landing", industry: "consulting", style: "bold", tags: ["innovation", "incubator", "startup"], preview_url: UNSPLASH.consulting },

  // ─── Education (10) ──────────────────────────────
  { name: "Modern Language School", slug: "modern-language-school", description: "Modern language school with course catalog and enrollment", category: "business", industry: "education", style: "modern", tags: ["language", "courses", "learning"], preview_url: UNSPLASH.education },
  { name: "Dark Music Academy", slug: "dark-music-academy", description: "Dark, stylish music school with instructor profiles", category: "business", industry: "education", style: "dark", tags: ["music", "instruments", "lessons"], preview_url: UNSPLASH.education },
  { name: "Warm Montessori School", slug: "warm-montessori-school", description: "Warm Montessori school with nurturing environment focus", category: "business", industry: "education", style: "warm", tags: ["montessori", "children", "early-learning"], preview_url: UNSPLASH.education },
  { name: "Minimal Online Course", slug: "minimal-online-course", description: "Minimal online course landing with curriculum and pricing", category: "saas", industry: "education", style: "minimal", tags: ["online-course", "elearning", "digital"], preview_url: UNSPLASH.education },
  { name: "Bold Coding Bootcamp", slug: "bold-coding-bootcamp", description: "Bold coding bootcamp with outcomes and curriculum", category: "landing", industry: "education", style: "bold", tags: ["coding", "bootcamp", "tech"], preview_url: UNSPLASH.education },
  { name: "Elegant Art School", slug: "elegant-art-school", description: "Elegant art school with student gallery and programs", category: "business", industry: "education", style: "elegant", tags: ["art", "studio", "creative"], preview_url: UNSPLASH.education },
  { name: "Playful Daycare", slug: "playful-daycare", description: "Playful daycare center with programs and parent info", category: "business", industry: "education", style: "playful", tags: ["daycare", "childcare", "preschool"], preview_url: UNSPLASH.education },
  { name: "Corporate Training", slug: "corporate-training", description: "Corporate training provider with programs and certifications", category: "business", industry: "education", style: "corporate", tags: ["training", "corporate", "certification"], preview_url: UNSPLASH.education },
  { name: "Tutoring Center", slug: "tutoring-center", description: "Tutoring center with subject areas and tutor profiles", category: "business", industry: "education", style: "modern", tags: ["tutoring", "academic", "students"], preview_url: UNSPLASH.education },
  { name: "Driving School", slug: "driving-school", description: "Driving school with lesson packages and pass rates", category: "business", industry: "education", style: "bold", tags: ["driving", "lessons", "license"], preview_url: UNSPLASH.education },
]
