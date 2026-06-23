import type { ReferenceSite } from "@/types"

function site(
  id: string,
  name: string,
  description: string,
  industry: string,
  html: string,
  thumbnail: string,
  sortOrder: number,
): ReferenceSite {
  return {
    id,
    name,
    description,
    industry,
    html,
    css: "",
    thumbnail_url: thumbnail,
    sort_order: sortOrder,
    status: "approved",
    created_by: "system",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }
}

export const DEFAULT_REFERENCE_SITES: ReferenceSite[] = [
  site(
    "ref-modern-agency",
    "Modern Agency",
    "Dark, bold creative agency with gradient accents and strong typography",
    "agency",
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#f0f0f0;background:#0a0a0f}
.hero{min-height:90vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 50%,#16213e 100%);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;right:-20%;width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%);border-radius:50%}
.hero-inner{max-width:800px;padding:3rem 2rem;text-align:center;position:relative;z-index:1}
.badge{display:inline-block;background:rgba(99,102,241,0.15);color:#818cf8;padding:0.4rem 1rem;border-radius:99px;font-size:0.8rem;font-weight:600;letter-spacing:0.05em;margin-bottom:1.5rem}
h1{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:800;line-height:1.1;letter-spacing:-0.03em}
h1 span{background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.tagline{font-size:1.15rem;color:#9ca3af;margin-top:1.5rem;line-height:1.7;max-width:560px;margin-left:auto;margin-right:auto}
.btn-row{display:flex;gap:1rem;justify-content:center;margin-top:2.5rem}
.btn{padding:0.8rem 2rem;border-radius:12px;font-weight:600;font-size:0.95rem;text-decoration:none;transition:all 0.2s}
.btn-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none}
.btn-secondary{background:transparent;color:#e5e7eb;border:1px solid #374151}
.services{max-width:1100px;margin:0 auto;padding:6rem 2rem}
.services h2{font-size:2rem;font-weight:700;text-align:center;margin-bottom:0.5rem}
.services .sub{text-align:center;color:#6b7280;margin-bottom:3rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:2rem;transition:border-color 0.2s}
.card:hover{border-color:#4f46e5}
.card-icon{width:48px;height:48px;border-radius:12px;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:1rem;color:#818cf8;font-size:1.3rem}
.card h3{font-size:1.15rem;font-weight:600;margin-bottom:0.5rem}
.card p{color:#9ca3af;font-size:0.9rem;line-height:1.6}
.about{max-width:1100px;margin:0 auto;padding:6rem 2rem;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
.about-img{aspect-ratio:4/3;background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:20px;display:flex;align-items:flex-end;padding:2rem;position:relative;overflow:hidden}
.about-img::before{content:'';position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80') center/cover}
.about-img .stat{position:relative;z-index:1;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);padding:0.8rem 1.5rem;border-radius:12px;font-weight:700;font-size:1.3rem;color:#818cf8}
.about-text h2{font-size:2rem;font-weight:700;margin-bottom:1rem}
.about-text p{color:#9ca3af;line-height:1.8;margin-bottom:1rem}
.stats{display:flex;gap:2rem;margin-top:2rem}
.stat-item .num{font-size:1.8rem;font-weight:800;color:#818cf8}
.stat-item .label{font-size:0.8rem;color:#6b7280;margin-top:0.2rem}
.contact{max-width:800px;margin:0 auto;padding:6rem 2rem;text-align:center}
.contact h2{font-size:2rem;font-weight:700;margin-bottom:0.5rem}
.contact .sub{color:#6b7280;margin-bottom:2.5rem}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;text-align:left}
.contact-info{display:flex;flex-direction:column;gap:1.5rem}
.contact-item .clabel{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:0.3rem}
.contact-item .cvalue{color:#c084fc;font-size:0.95rem}
.contact form{display:flex;flex-direction:column;gap:1rem}
.contact input,.contact textarea{background:#111827;border:1px solid #1f2937;border-radius:10px;padding:0.8rem 1rem;color:#f0f0f0;font-size:0.9rem;font-family:inherit}
.contact textarea{min-height:100px;resize:vertical}
.contact button[type=submit]{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;padding:0.8rem;font-weight:600;font-size:0.95rem;cursor:pointer}
footer{text-align:center;padding:2rem;color:#4b5563;font-size:0.8rem;border-top:1px solid #1f2937}
@media(max-width:768px){.about{grid-template-columns:1fr}.contact-grid{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}
</style></head><body>
<div class="hero"><div class="hero-inner"><span class="badge">Next-Gen Digital Studio</span><h1>We Build <span>Digital</span> Experiences That Matter</h1><p class="tagline">A modern creative agency crafting bold identities, seamless interfaces, and powerful digital products for forward-thinking brands.</p><div class="btn-row"><a class="btn btn-primary" href="#">Start Your Project</a><a class="btn btn-secondary" href="#">Explore Services</a></div></div></div>
<section class="services"><h2>Crafted Services, Bold Outcomes.</h2><p class="sub">Every solution is tailored to your vision — we blend strategy, design, and technology to create something unforgettable.</p><div class="grid"><div class="card"><div class="card-icon">+</div><h3>Brand Identity</h3><p>Distinctive brand strategies, visual identities, and storytelling that sets you apart in any market.</p></div><div class="card"><div class="card-icon">◇</div><h3>Product Design</h3><p>End-to-end design of digital products — from research and prototyping to pixel-perfect interfaces.</p></div><div class="card"><div class="card-icon">+</div><h3>Web Development</h3><p>High-performance websites and web applications built with modern stacks, optimized for speed and scale.</p></div><div class="card"><div class="card-icon">⚡</div><h3>Motion & Interaction</h3><p>Fluid animations, micro-interactions, and motion design that brings your product to life.</p></div><div class="card"><div class="card-icon">●</div><h3>Strategy & Consulting</h3><p>Data-driven roadmaps, UX strategy, and digital transformation consulting for lasting impact.</p></div><div class="card"><div class="card-icon">▣</div><h3>Art Direction</h3><p>Creative direction, visual campaigns, and content creation that builds a cohesive brand world.</p></div></div></section>
<section class="about"><div class="about-img"><span class="stat">6+</span></div><div class="about-text"><span class="badge">About Us</span><h2>Where Vision Meets Craft.</h2><p>We're a tight-knit team of designers, developers, and strategists who believe in the power of bold ideas. Founded in 2019, we've grown into a global creative partner for brands that refuse to blend in.</p><p>Every project begins with listening — we immerse ourselves in your world, then craft solutions that feel both fresh and familiar. No ego, no fluff. Just honest, beautiful work that moves the needle.</p><div class="stats"><div class="stat-item"><div class="num">50+</div><div class="label">Projects Delivered</div></div><div class="stat-item"><div class="num">24</div><div class="label">Global Clients</div></div><div class="stat-item"><div class="num">6</div><div class="label">Years of Craft</div></div></div></div></section>
<section class="contact"><h2>Start Something Remarkable.</h2><p class="sub">Have a project in mind? We'd love to hear about it. Reach out and let's create something extraordinary together.</p><div class="contact-grid"><div class="contact-info"><div class="contact-item"><div class="clabel">Email</div><div class="cvalue">hello@agency.com</div></div><div class="contact-item"><div class="clabel">Phone</div><div class="cvalue">+91 9100 684109</div></div><div class="contact-item"><div class="clabel">Studio</div><div class="cvalue">212 Creative Lane, Brooklyn, NY 11201</div></div></div><form><input name="name" type="text" placeholder="Your Name" required><input name="email" type="email" placeholder="Email Address" required><textarea name="message" placeholder="Your Message" required></textarea><button type="submit">Send Message →</button></form></div></section>
<footer>© 2026 Agency. Crafted with purpose. All rights reserved.</footer>
</body></html>`,
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=70",
    1,
  ),

  site(
    "ref-warm-restaurant",
    "Warm Restaurant",
    "Cozy, inviting restaurant with earthy tones, serif fonts, and food imagery",
    "restaurant",
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#2a1c10;background:#faf6f1}
.hero{min-height:80vh;display:flex;align-items:center;background:linear-gradient(rgba(42,28,16,0.6),rgba(42,28,16,0.6)),url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80') center/cover;color:#fff}
.hero-inner{max-width:700px;padding:4rem 2rem;margin:0 auto;text-align:center}
h1{font-size:clamp(2.5rem,5vw,4rem);font-weight:700;line-height:1.15}
.hero p{font-size:1.1rem;color:#e8d5c4;margin-top:1rem;font-style:italic}
.hero .btn{display:inline-block;margin-top:2rem;background:#b45309;color:#fff;padding:0.9rem 2.5rem;border-radius:99px;text-decoration:none;font-size:0.95rem;font-weight:600;transition:background 0.2s}
nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 2rem;background:#faf6f1;border-bottom:1px solid #e5d9cc}
nav .logo{font-size:1.3rem;font-weight:700;color:#3d2b1f;letter-spacing:0.02em}
nav ul{list-style:none;display:flex;gap:2rem}
nav a{text-decoration:none;color:#5c4a3a;font-size:0.9rem}
.section{max-width:900px;margin:0 auto;padding:5rem 2rem}
.section h2{font-size:1.8rem;font-weight:700;color:#3d2b1f;margin-bottom:1rem;text-align:center}
.section .sub{text-align:center;color:#6b5744;margin-bottom:3rem;font-style:italic}
.menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
.menu-card{background:#fff;border:1px solid #e5d9cc;border-radius:16px;overflow:hidden}
.menu-card img{width:100%;aspect-ratio:16/10;object-fit:cover}
.menu-card-body{padding:1.5rem}
.menu-card h3{font-size:1.1rem;font-weight:700;color:#3d2b1f;margin-bottom:0.4rem}
.menu-card p{color:#6b5744;font-size:0.9rem;line-height:1.5}
.menu-card .price{color:#b45309;font-weight:700;margin-top:0.5rem;font-size:1rem}
.about-section{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;max-width:1000px;margin:0 auto;padding:5rem 2rem}
.about-img{border-radius:20px;overflow:hidden}
.about-img img{width:100%;aspect-ratio:4/3;object-fit:cover}
.about-text p{color:#5c4a3a;line-height:1.8;margin-bottom:1rem}
.hours{background:#3d2b1f;color:#faf6f1;padding:4rem 2rem;text-align:center}
.hours h2{color:#e8d5c4;margin-bottom:2rem}
.hours-grid{display:flex;justify-content:center;gap:3rem;flex-wrap:wrap}
.hours-item .day{font-weight:700;color:#d4a574;margin-bottom:0.3rem}
.hours-item .time{font-size:0.9rem;color:#b5a08a}
.contact-section{max-width:600px;margin:0 auto;padding:5rem 2rem;text-align:center}
.contact-section form{display:flex;flex-direction:column;gap:1rem;margin-top:2rem;text-align:left}
.contact-section input,.contact-section textarea{border:1px solid #e5d9cc;border-radius:10px;padding:0.8rem 1rem;font-family:inherit;font-size:0.9rem;background:#fff}
.contact-section textarea{min-height:100px;resize:vertical}
.contact-section button{background:#b45309;color:#fff;border:none;border-radius:99px;padding:0.9rem;font-weight:600;font-size:0.95rem;cursor:pointer;font-family:inherit}
footer{text-align:center;padding:2rem;color:#b5a08a;font-size:0.8rem;border-top:1px solid #e5d9cc}
@media(max-width:768px){.about-section{grid-template-columns:1fr}}
</style></head><body>
<nav><span class="logo">La Maison</span><ul><li><a href="#">Menu</a></li><li><a href="#">About</a></li><li><a href="#">Reservations</a></li><li><a href="#">Contact</a></li></ul></nav>
<div class="hero"><div class="hero-inner"><h1>A Taste of Tradition</h1><p>Farm-to-table dining in the heart of the city. Where every meal tells a story.</p><a class="btn" href="#">Reserve a Table</a></div></div>
<section class="section"><h2>Our Menu</h2><p class="sub">Seasonal ingredients, timeless recipes</p><div class="menu-grid"><div class="menu-card"><img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=70" alt="Dish"><div class="menu-card-body"><h3>Herb-Crusted Lamb</h3><p>Slow-roasted with rosemary, served with seasonal vegetables</p><div class="price">$34</div></div></div><div class="menu-card"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70" alt="Dish"><div class="menu-card-body"><h3>Truffle Risotto</h3><p>Arborio rice, black truffle, aged parmesan</p><div class="price">$28</div></div></div><div class="menu-card"><img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=70" alt="Dish"><div class="menu-card-body"><h3>Pan-Seared Salmon</h3><p>Wild-caught, lemon butter sauce, asparagus</p><div class="price">$32</div></div></div></div></section>
<section class="about-section"><div class="about-img"><img src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80" alt="Our restaurant"></div><div class="about-text"><h2>Our Story</h2><p>Since 2015, La Maison has been a gathering place for food lovers who believe that dining is an art form. Our chef sources ingredients from local farms every morning.</p><p>We believe the best meals are shared. Whether it's a quiet dinner for two or a celebration with friends, our dining room welcomes you home.</p></div></section>
<section class="hours"><h2>Opening Hours</h2><div class="hours-grid"><div class="hours-item"><div class="day">Mon – Thu</div><div class="time">11:00 AM – 10:00 PM</div></div><div class="hours-item"><div class="day">Fri – Sat</div><div class="time">11:00 AM – 11:30 PM</div></div><div class="hours-item"><div class="day">Sunday</div><div class="time">10:00 AM – 9:00 PM</div></div></div></section>
<section class="contact-section"><h2>Get in Touch</h2><p class="sub" style="color:#6b5744">For reservations or enquiries, reach out anytime.</p><form><input name="name" placeholder="Your Name" required><input name="email" type="email" placeholder="Email" required><input name="phone" type="tel" placeholder="Phone Number"><textarea name="message" placeholder="Your Message" required></textarea><button type="submit">Send Message</button></form></section>
<footer>© 2026 La Maison · 123 Culinary Street · All rights reserved</footer>
</body></html>`,
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=640&q=70",
    2,
  ),

  site(
    "ref-clean-saas",
    "Clean SaaS",
    "Light, minimal SaaS landing page with pricing, features, and testimonials",
    "saas",
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;color:#1a1a2e;background:#fff}
nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;max-width:1200px;margin:0 auto}
nav .logo{font-size:1.2rem;font-weight:800;color:#2563eb}
nav ul{list-style:none;display:flex;gap:2rem}
nav a{text-decoration:none;color:#4b5563;font-size:0.9rem}
.hero{max-width:800px;margin:0 auto;padding:6rem 2rem;text-align:center}
.chip{display:inline-flex;align-items:center;gap:0.5rem;background:#eff6ff;color:#2563eb;padding:0.4rem 1rem;border-radius:99px;font-size:0.8rem;font-weight:600;margin-bottom:1.5rem}
h1{font-size:clamp(2.2rem,5vw,3.5rem);font-weight:800;line-height:1.15;letter-spacing:-0.03em}
h1 span{color:#2563eb}
.hero p{font-size:1.1rem;color:#6b7280;margin-top:1rem;line-height:1.7}
.hero .btn-row{display:flex;gap:1rem;justify-content:center;margin-top:2rem}
.btn{padding:0.75rem 2rem;border-radius:10px;font-weight:600;font-size:0.9rem;text-decoration:none;transition:all 0.2s;display:inline-block}
.btn-blue{background:#2563eb;color:#fff}
.btn-outline{border:1px solid #d1d5db;color:#374151}
.features{max-width:1100px;margin:0 auto;padding:5rem 2rem}
.features h2{font-size:1.8rem;font-weight:700;text-align:center;margin-bottom:0.5rem}
.features .sub{text-align:center;color:#6b7280;margin-bottom:3rem}
.f-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}
.f-card{background:#f9fafb;border-radius:16px;padding:2rem;border:1px solid #f3f4f6}
.f-card .icon{width:44px;height:44px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;color:#2563eb;font-size:1.2rem}
.f-card h3{font-size:1rem;font-weight:600;margin-bottom:0.4rem}
.f-card p{color:#6b7280;font-size:0.88rem;line-height:1.6}
.pricing{background:#f9fafb;padding:5rem 2rem}
.pricing h2{font-size:1.8rem;font-weight:700;text-align:center;margin-bottom:3rem}
.p-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;max-width:1000px;margin:0 auto}
.p-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:2rem;text-align:center}
.p-card.popular{border:2px solid #2563eb;position:relative}
.p-card.popular::before{content:'Most Popular';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:0.2rem 1rem;border-radius:99px;font-size:0.7rem;font-weight:600}
.p-card .plan-name{font-weight:600;margin-bottom:0.5rem}
.p-card .price{font-size:2.5rem;font-weight:800;color:#111;margin-bottom:0.3rem}
.p-card .price span{font-size:1rem;color:#6b7280;font-weight:400}
.p-card ul{list-style:none;text-align:left;margin:1.5rem 0;font-size:0.88rem;color:#4b5563}
.p-card li{padding:0.4rem 0;border-bottom:1px solid #f3f4f6}
.p-card li::before{content:'✓ ';color:#2563eb;font-weight:700}
.p-card .btn{width:100%;text-align:center;display:block}
.testimonials{max-width:1000px;margin:0 auto;padding:5rem 2rem}
.testimonials h2{font-size:1.8rem;font-weight:700;text-align:center;margin-bottom:3rem}
.t-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
.t-card{background:#f9fafb;border-radius:16px;padding:2rem;border:1px solid #f3f4f6}
.t-card p{color:#4b5563;font-size:0.92rem;line-height:1.7;font-style:italic;margin-bottom:1rem}
.t-card .author{font-weight:600;font-size:0.85rem;color:#111}
.t-card .role{font-size:0.78rem;color:#9ca3af}
.cta{text-align:center;padding:5rem 2rem;background:#111827;color:#fff}
.cta h2{font-size:2rem;font-weight:700;margin-bottom:0.5rem}
.cta p{color:#9ca3af;margin-bottom:2rem}
footer{text-align:center;padding:2rem;color:#9ca3af;font-size:0.8rem;border-top:1px solid #e5e7eb}
@media(max-width:768px){.f-grid,.p-grid,.t-grid{grid-template-columns:1fr}}
</style></head><body>
<nav><span class="logo">FlowStack</span><ul><li><a href="#">Features</a></li><li><a href="#">Pricing</a></li><li><a href="#">About</a></li></ul></nav>
<section class="hero"><span class="chip">🚀 Now in Open Beta</span><h1>Ship Faster with <span>FlowStack</span></h1><p>The modern workflow platform that helps teams plan, build, and deliver exceptional products — without the chaos.</p><div class="btn-row"><a class="btn btn-blue" href="#">Get Started Free</a><a class="btn btn-outline" href="#">See a Demo</a></div></section>
<section class="features"><h2>Everything you need</h2><p class="sub">Simple tools that grow with your team</p><div class="f-grid"><div class="f-card"><div class="icon">⚡</div><h3>Lightning Fast</h3><p>Sub-50ms response times. Your tools should never slow you down.</p></div><div class="f-card"><div class="icon">🔒</div><h3>Enterprise Security</h3><p>SOC 2 compliant, end-to-end encryption, SSO out of the box.</p></div><div class="f-card"><div class="icon">📊</div><h3>Real-time Analytics</h3><p>Live dashboards, custom reports, and actionable insights.</p></div><div class="f-card"><div class="icon">🔗</div><h3>Integrations</h3><p>Connect with 100+ tools including Slack, GitHub, and Jira.</p></div><div class="f-card"><div class="icon">🤖</div><h3>AI-Powered</h3><p>Smart suggestions, auto-categorization, and predictive workflows.</p></div><div class="f-card"><div class="icon">📱</div><h3>Mobile Ready</h3><p>Full-featured mobile apps for iOS and Android.</p></div></div></section>
<section class="pricing"><h2>Simple, transparent pricing</h2><div class="p-grid"><div class="p-card"><div class="plan-name">Starter</div><div class="price">$0<span>/mo</span></div><ul><li>Up to 5 team members</li><li>Basic analytics</li><li>1 GB storage</li><li>Email support</li></ul><a class="btn btn-outline" href="#">Start Free</a></div><div class="p-card popular"><div class="plan-name">Pro</div><div class="price">$29<span>/mo</span></div><ul><li>Unlimited members</li><li>Advanced analytics</li><li>100 GB storage</li><li>Priority support</li></ul><a class="btn btn-blue" href="#">Start Trial</a></div><div class="p-card"><div class="plan-name">Enterprise</div><div class="price">Custom</div><ul><li>Everything in Pro</li><li>SSO & SAML</li><li>Dedicated support</li><li>Custom integrations</li></ul><a class="btn btn-outline" href="#">Contact Sales</a></div></div></section>
<section class="testimonials"><h2>Loved by teams worldwide</h2><div class="t-grid"><div class="t-card"><p>"FlowStack completely transformed how our engineering team ships. We went from bi-weekly releases to daily deploys."</p><div class="author">Sarah Chen</div><div class="role">VP Engineering, Acme Inc</div></div><div class="t-card"><p>"The AI features alone save us 10+ hours per sprint. It's like having an extra PM on the team."</p><div class="author">Marcus Rivera</div><div class="role">Product Lead, TechCo</div></div></div></section>
<section class="cta"><h2>Ready to ship faster?</h2><p>Join 2,000+ teams already using FlowStack.</p><a class="btn btn-blue" href="#">Get Started — It's Free</a></section>
<footer>© 2026 FlowStack · All rights reserved</footer>
</body></html>`,
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=70",
    3,
  ),

  site(
    "ref-elegant-salon",
    "Elegant Salon",
    "Soft, sophisticated beauty salon with pastels, rounded shapes, and booking CTA",
    "salon",
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#2d2d2d;background:#fdf8f5}
nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 2rem;max-width:1100px;margin:0 auto}
nav .logo{font-size:1.3rem;font-weight:700;color:#be185d;letter-spacing:0.03em}
nav ul{list-style:none;display:flex;gap:2rem}nav a{text-decoration:none;color:#6b5563;font-size:0.9rem}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;max-width:1100px;margin:0 auto;padding:4rem 2rem}
.hero-text h1{font-size:clamp(2rem,4vw,3rem);font-weight:700;line-height:1.2;color:#1f1f1f}
.hero-text h1 span{color:#be185d}
.hero-text p{color:#6b5563;margin-top:1rem;line-height:1.7;font-size:1rem}
.hero-text .btn{display:inline-block;margin-top:1.5rem;background:#be185d;color:#fff;padding:0.85rem 2rem;border-radius:99px;text-decoration:none;font-weight:600;font-size:0.9rem}
.hero-img{border-radius:24px;overflow:hidden}
.hero-img img{width:100%;aspect-ratio:3/4;object-fit:cover}
.services{max-width:1100px;margin:0 auto;padding:5rem 2rem;text-align:center}
.services h2{font-size:1.8rem;font-weight:700;margin-bottom:0.5rem}
.services .sub{color:#9a8a94;margin-bottom:3rem}
.s-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem}
.s-card{background:#fff;border-radius:20px;padding:2rem;text-align:center;border:1px solid #f5e6ec;transition:box-shadow 0.2s}
.s-card:hover{box-shadow:0 8px 30px rgba(190,24,93,0.08)}
.s-card .icon{font-size:2rem;margin-bottom:1rem}
.s-card h3{font-size:1rem;font-weight:600;margin-bottom:0.4rem;color:#1f1f1f}
.s-card p{color:#9a8a94;font-size:0.85rem;line-height:1.5}
.s-card .price{color:#be185d;font-weight:700;margin-top:0.8rem;font-size:1.1rem}
.gallery{max-width:1100px;margin:0 auto;padding:2rem;display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px}
.book-cta{background:linear-gradient(135deg,#fdf2f8,#fce7f3);padding:5rem 2rem;text-align:center}
.book-cta h2{font-size:2rem;font-weight:700;color:#1f1f1f;margin-bottom:0.5rem}
.book-cta p{color:#6b5563;margin-bottom:2rem}
.book-cta .btn{background:#be185d;color:#fff;padding:1rem 3rem;border-radius:99px;text-decoration:none;font-weight:600;font-size:1rem;display:inline-block}
.contact{max-width:500px;margin:0 auto;padding:5rem 2rem;text-align:center}
.contact h2{margin-bottom:2rem}
.contact form{display:flex;flex-direction:column;gap:1rem}
.contact input,.contact textarea{border:1px solid #f5e6ec;border-radius:12px;padding:0.85rem 1rem;font-family:inherit;font-size:0.9rem;background:#fff}
.contact textarea{min-height:90px;resize:vertical}
.contact button{background:#be185d;color:#fff;border:none;border-radius:99px;padding:0.85rem;font-weight:600;cursor:pointer;font-family:inherit}
footer{text-align:center;padding:2rem;color:#c4a8b7;font-size:0.8rem;border-top:1px solid #f5e6ec}
@media(max-width:768px){.hero{grid-template-columns:1fr}.gallery{grid-template-columns:1fr 1fr}}
</style></head><body>
<nav><span class="logo">Bloom Studio</span><ul><li><a href="#">Services</a></li><li><a href="#">Gallery</a></li><li><a href="#">Book Now</a></li></ul></nav>
<section class="hero"><div class="hero-text"><h1>Your <span>Beauty</span>, Elevated</h1><p>Expert stylists, premium products, and a space designed to make you feel extraordinary. Book your transformation today.</p><a class="btn" href="/book">Book Appointment</a></div><div class="hero-img"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80" alt="Salon"></div></section>
<section class="services"><h2>Our Services</h2><p class="sub">Curated treatments for every need</p><div class="s-grid"><div class="s-card"><div class="icon">✂️</div><h3>Haircut & Styling</h3><p>Precision cuts and styling for all hair types</p><div class="price">From $45</div></div><div class="s-card"><div class="icon">🎨</div><h3>Color & Highlights</h3><p>Balayage, ombré, and full-color transformations</p><div class="price">From $85</div></div><div class="s-card"><div class="icon">💅</div><h3>Nails & Manicure</h3><p>Gel, acrylic, and luxury nail art</p><div class="price">From $30</div></div><div class="s-card"><div class="icon">🧖</div><h3>Facial Treatments</h3><p>Deep cleansing, hydration, and anti-aging facials</p><div class="price">From $65</div></div></div></section>
<div class="gallery"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=70" alt="Work"><img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500&q=70" alt="Work"><img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500&q=70" alt="Work"></div>
<section class="book-cta"><h2>Ready for a fresh look?</h2><p>Book your appointment online — it takes less than a minute.</p><a class="btn" href="/book">Book Now</a></section>
<section class="contact"><h2>Contact Us</h2><form><input name="name" placeholder="Your Name" required><input name="email" type="email" placeholder="Email" required><textarea name="message" placeholder="Questions or special requests?" required></textarea><button type="submit">Send</button></form></section>
<footer>© 2026 Bloom Studio · All rights reserved</footer>
</body></html>`,
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=640&q=70",
    4,
  ),

  site(
    "ref-dark-portfolio",
    "Dark Portfolio",
    "Moody, image-forward photography portfolio with full-width gallery",
    "photography",
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,sans-serif;color:#e5e5e5;background:#0c0c0c}
nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 2rem}
nav .logo{font-size:1.1rem;font-weight:300;letter-spacing:0.15em;text-transform:uppercase}
nav ul{list-style:none;display:flex;gap:2rem}nav a{text-decoration:none;color:#888;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase}
.hero{height:90vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1400&q=80') center/cover;opacity:0.25}
.hero-inner{position:relative;z-index:1;padding:2rem}
.hero h1{font-size:clamp(2rem,5vw,4rem);font-weight:200;letter-spacing:0.08em;text-transform:uppercase;line-height:1.3}
.hero p{font-size:0.95rem;color:#888;margin-top:1rem;letter-spacing:0.05em}
.gallery{padding:1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem}
.gallery img{width:100%;aspect-ratio:3/2;object-fit:cover;transition:opacity 0.3s}
.gallery img:hover{opacity:0.7}
.about{max-width:700px;margin:0 auto;padding:6rem 2rem;text-align:center}
.about h2{font-size:1.2rem;font-weight:300;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:1.5rem;color:#ccc}
.about p{color:#888;line-height:2;font-size:0.92rem}
.contact{max-width:500px;margin:0 auto;padding:4rem 2rem;text-align:center}
.contact h2{font-size:1.2rem;font-weight:300;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:2rem;color:#ccc}
.contact form{display:flex;flex-direction:column;gap:1rem}
.contact input,.contact textarea{background:#161616;border:1px solid #2a2a2a;border-radius:4px;padding:0.8rem 1rem;color:#e5e5e5;font-family:inherit;font-size:0.85rem}
.contact textarea{min-height:100px;resize:vertical}
.contact button{background:#fff;color:#0c0c0c;border:none;padding:0.8rem;font-weight:600;font-size:0.85rem;cursor:pointer;letter-spacing:0.05em;text-transform:uppercase}
footer{text-align:center;padding:3rem;color:#444;font-size:0.75rem;letter-spacing:0.08em}
@media(max-width:768px){.gallery{grid-template-columns:1fr 1fr}}
</style></head><body>
<nav><span class="logo">Alex Rivera</span><ul><li><a href="#">Work</a></li><li><a href="#">About</a></li><li><a href="#">Contact</a></li></ul></nav>
<section class="hero"><div class="hero-inner"><h1>Capturing Light & Story</h1><p>Photography · Film · Visual Storytelling</p></div></section>
<div class="gallery"><img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&q=70" alt=""><img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=700&q=70" alt=""><img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=700&q=70" alt=""><img src="https://images.unsplash.com/photo-1470770841497-7e4608ce11be?w=700&q=70" alt=""><img src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=700&q=70" alt=""><img src="https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=700&q=70" alt=""></div>
<section class="about"><h2>About</h2><p>I'm a visual storyteller based in Brooklyn, NY. For the past decade, I've traveled the world documenting landscapes, cultures, and the quiet moments in between. My work has been featured in National Geographic, VSCO, and Adobe Lightroom.</p></section>
<section class="contact"><h2>Get in Touch</h2><form><input name="name" placeholder="Name" required><input name="email" type="email" placeholder="Email" required><textarea name="message" placeholder="Tell me about your project" required></textarea><button type="submit">Send Message</button></form></section>
<footer>© 2026 Alex Rivera Photography</footer>
</body></html>`,
    "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=640&q=70",
    5,
  ),

  site(
    "ref-minimal-professional",
    "Minimal Professional",
    "Clean, whitespace-heavy professional services site with blue accents",
    "professional",
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;color:#1e293b;background:#fff}
nav{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 2rem;max-width:1000px;margin:0 auto}
nav .logo{font-size:1.2rem;font-weight:700;color:#0f172a}
nav ul{list-style:none;display:flex;gap:2rem}nav a{text-decoration:none;color:#64748b;font-size:0.9rem}
.hero{max-width:700px;margin:0 auto;padding:6rem 2rem;text-align:center}
h1{font-size:clamp(2rem,4.5vw,3rem);font-weight:700;line-height:1.25;letter-spacing:-0.02em}
.hero p{color:#64748b;margin-top:1rem;line-height:1.8;font-size:1rem}
.hero .btn{display:inline-block;margin-top:2rem;background:#2563eb;color:#fff;padding:0.8rem 2rem;border-radius:10px;text-decoration:none;font-weight:600;font-size:0.9rem}
.section{max-width:900px;margin:0 auto;padding:4rem 2rem}
.section h2{font-size:1.5rem;font-weight:600;margin-bottom:2rem;text-align:center}
.divider{width:40px;height:2px;background:#2563eb;margin:0 auto 2rem}
.s-list{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem}
.s-item{border-top:2px solid #e2e8f0;padding-top:1.5rem}
.s-item h3{font-size:1rem;font-weight:600;margin-bottom:0.4rem}
.s-item p{color:#64748b;font-size:0.88rem;line-height:1.6}
.trust{background:#f8fafc;padding:4rem 2rem;text-align:center}
.trust h2{font-size:1.5rem;font-weight:600;margin-bottom:2rem}
.trust-row{display:flex;justify-content:center;gap:3rem;flex-wrap:wrap}
.trust-item{text-align:center}
.trust-item .num{font-size:2.5rem;font-weight:800;color:#2563eb}
.trust-item .label{font-size:0.8rem;color:#64748b;margin-top:0.3rem}
.contact{max-width:500px;margin:0 auto;padding:4rem 2rem}
.contact h2{text-align:center;margin-bottom:2rem}
.contact form{display:flex;flex-direction:column;gap:1rem}
.contact input,.contact textarea{border:1px solid #e2e8f0;border-radius:8px;padding:0.8rem 1rem;font-family:inherit;font-size:0.9rem}
.contact textarea{min-height:100px;resize:vertical}
.contact button{background:#2563eb;color:#fff;border:none;border-radius:8px;padding:0.85rem;font-weight:600;cursor:pointer;font-family:inherit}
footer{text-align:center;padding:2rem;color:#94a3b8;font-size:0.8rem;border-top:1px solid #e2e8f0}
@media(max-width:768px){.s-list{grid-template-columns:1fr}}
</style></head><body>
<nav><span class="logo">Meridian</span><ul><li><a href="#">Services</a></li><li><a href="#">About</a></li><li><a href="#">Contact</a></li></ul></nav>
<section class="hero"><h1>Strategic consulting for growing businesses</h1><p>We help companies navigate complexity, streamline operations, and build sustainable growth strategies. No jargon, just results.</p><a class="btn" href="#contact">Get in Touch</a></section>
<section class="section"><h2>What We Do</h2><div class="divider"></div><div class="s-list"><div class="s-item"><h3>Business Strategy</h3><p>Market analysis, competitive positioning, and growth roadmaps tailored to your industry.</p></div><div class="s-item"><h3>Operations</h3><p>Process optimization, workflow automation, and operational efficiency improvements.</p></div><div class="s-item"><h3>Digital Transformation</h3><p>Technology strategy, system integration, and change management for modern teams.</p></div><div class="s-item"><h3>Financial Advisory</h3><p>Budgeting, forecasting, fundraising strategy, and financial modeling.</p></div></div></section>
<section class="trust"><h2>Trusted by leaders</h2><div class="trust-row"><div class="trust-item"><div class="num">120+</div><div class="label">Clients Served</div></div><div class="trust-item"><div class="num">$2B+</div><div class="label">Revenue Impacted</div></div><div class="trust-item"><div class="num">15</div><div class="label">Years Experience</div></div></div></section>
<section class="contact" id="contact"><h2>Let's talk</h2><form><input name="name" placeholder="Your Name" required><input name="email" type="email" placeholder="Email" required><input name="phone" type="tel" placeholder="Phone (optional)"><textarea name="message" placeholder="How can we help?" required></textarea><button type="submit">Send Message</button></form></section>
<footer>© 2026 Meridian Consulting</footer>
</body></html>`,
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=70",
    6,
  ),
]
