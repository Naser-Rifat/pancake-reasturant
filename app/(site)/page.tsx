import Link from "next/link";
import Announce from "@/components/Announce";
import ReviewForm from "@/components/ReviewForm";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import {
  TAG_LABEL,
  formatTime,
  getAnnouncement,
  getFeaturedMenu,
  getGallery,
  getHours,
  getReviews,
  heatClass,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const CERTS = [
  ["🛡️", "Food Safety Certified", "NSW Food Authority"],
  ["⭐", "5-Star Hygiene Rating", "Local Council Inspection"],
  ["🏆", "Best Pancakes — Sydney 2025", "Local Eats Awards"],
  ["✅", "HACCP Compliant", "Certified Kitchen"],
  ["🌱", "Local Produce Partner", "NSW Farmers' Network"],
];

export default async function Home() {
  const [announcement, featured, gallery, reviews, hours] = await Promise.all([
    getAnnouncement(),
    getFeaturedMenu(),
    getGallery(),
    getReviews(),
    getHours(),
  ]);

  return (
    <main>
      <Announce data={announcement} />

      {/* ================= HERO (FR-01) ================= */}
      <section className="hero">
        <div className="container hero-cards">
          <div className="hero-card-left">
            <h1>
              Stack<br />Into <span className="script">Happiness</span>
            </h1>
            <p className="lead">
              We flip the best homemade pancakes in Sydney — griddled to order,
              stacked high, drowned in real maple.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/booking" className="btn btn-primary">Book a Table</Link>
              <Link href="/menu" className="btn btn-ghost" style={{ borderColor: "#fff", color: "#fff" }}>
                Explore Our Menu
              </Link>
            </div>
          </div>

          <div className="hero-card-right">
            <img
              src="https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=1200&q=80"
              alt="Maple syrup pouring over a golden pancake stack with walnuts"
            />
          </div>

          <Link href="/booking" className="round-badge" aria-label="Book a table — open 7 days">
            <span className="disc"></span>
            <svg viewBox="0 0 120 120">
              <defs>
                <path id="badgeCircle" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
              </defs>
              <text>
                <textPath href="#badgeCircle">Book a table • open 7 days •</textPath>
              </text>
            </svg>
            <span className="center-ic">🥞</span>
          </Link>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((i) => (
            <span key={i} style={{ display: "contents" }}>
              <span>Fluffy Stacks</span><span>✦</span><span>Real Maple</span><span>✦</span>
              <span>Est. 1999</span><span>✦</span><span>Fresh Berries</span><span>✦</span>
              <span>Zero Guilt</span><span>✦</span><span>Griddled Daily</span><span>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ================= FEATURED DISHES (FR-02) ================= */}
      <section className="block" id="featured">
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="kicker">Crowd Favourites</p>
            <h2 className="title">Featured <span className="accent">Stacks</span></h2>
            <p className="section-lead" style={{ marginInline: "auto" }}>
              Hand-picked by the chef. Griddled to order, gone in minutes.
            </p>
          </div>

          <div className="featured-grid reveal">
            {featured.map((f) => (
              <article className="menu-card" key={f.slug}>
                <div className="thumb">
                  <img src={f.image} alt={`${f.name} pancakes`} loading="lazy" />
                  <span className={`spice-tag ${heatClass(f.heat)}`}>🥞 {TAG_LABEL[f.tag]}</span>
                </div>
                <div className="body">
                  <div className="row1">
                    <h3>{f.name}</h3>
                    <span className="price">${parseFloat(f.price)}</span>
                  </div>
                  <p className="desc">{f.description}</p>
                  <Link href="/menu" className="btn btn-primary">See on Menu →</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="section-foot reveal">
            <Link href="/menu" className="btn btn-ghost">View Full Menu 🥞</Link>
          </div>
        </div>
      </section>

      {/* ================= ABOUT / WELCOME (FR-03) ================= */}
      <section className="block" id="about" style={{ paddingTop: "1rem" }}>
        <div className="container about-grid">
          <div className="about-collage reveal">
            <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=75" alt="KRUSH restaurant interior" />
            <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75" alt="Banana pancake stack" />
            <img src="https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=75" alt="Pancakes with honey drizzle" />
          </div>
          <div className="reveal">
            <p className="kicker">Welcome to KRUSH</p>
            <h2 className="title">
              Fluffy. Golden.<br /><span className="accent">Fully Stacked.</span>
            </h2>
            <p className="section-lead">
              G&apos;day! Every pancake at KRUSH is ladled to order onto a buttered
              griddle, flipped at exactly the right bubble, and stacked warm with
              real maple. No shortcuts, no pre-mix — just food that feels good.
            </p>
            <ul className="checklist">
              <li>Batter whisked fresh every morning</li>
              <li>100% pure Canadian maple — never syrup-flavoured</li>
              <li>Berries &amp; fruit from local NSW growers</li>
              <li>Cloud-light ricotta &amp; buttermilk stacks</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= GALLERY PREVIEW (FR-04) ================= */}
      <section className="block" id="gallery" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="kicker">Feast Your Eyes</p>
            <h2 className="title">From Our <span className="accent">Gallery</span></h2>
          </div>

          <div className="gallery-grid reveal">
            {gallery.slice(0, 8).map((p) => (
              <Link href="/gallery" key={p.image}>
                <img src={p.image} alt={p.alt} loading="lazy" />
              </Link>
            ))}
          </div>

          <div className="section-foot reveal">
            <Link href="/gallery" className="btn btn-ghost">See Full Gallery 📸</Link>
          </div>
        </div>
      </section>

      {/* ================= REVIEWS CAROUSEL (FR-05) ================= */}
      <section className="block" id="reviews" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="kicker">⭐ 4.8 Average Rating</p>
            <h2 className="title">What Our <span className="accent">Guests Say</span></h2>
          </div>
          <ReviewsCarousel reviews={reviews} />
          <ReviewForm />
        </div>
      </section>

      {/* ================= CERTIFICATIONS STRIP (FR-06) ================= */}
      <section className="block certs" id="certifications">
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="kicker">Dine With Confidence</p>
            <h2 className="title">Certified &amp; <span className="accent">Award-Winning</span></h2>
          </div>

          <div className="cert-strip reveal">
            {CERTS.map(([ic, title, sub]) => (
              <div className="cert-badge" key={title}>
                <span className="ic">{ic}</span>
                <span><b>{title}</b><small>{sub}</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOURS + LOCATION (FR-07) ================= */}
      <section className="block" id="contact">
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="kicker">Come Say Hi</p>
            <h2 className="title">Hours &amp; <span className="accent">Location</span></h2>
          </div>

          <div className="hours-grid reveal">
            <div className="hours-card">
              <h3>🕐 Opening Hours</h3>
              <ul className="hours-list">
                {hours.map((h) => (
                  <li key={h.label}>
                    <span>{h.label}</span>
                    <span>{formatTime(h.opens)} – {formatTime(h.closes)}</span>
                  </li>
                ))}
              </ul>
              <h3>📍 Find Us</h3>
              <div className="contact-lines">
                <span>123 George Street, Sydney NSW 2000</span>
                <span>Phone: <a href="tel:+61255501234">(02) 5550 1234</a></span>
                <span>Email: <a href="mailto:hello@krushpancakes.com.au">hello@krushpancakes.com.au</a></span>
              </div>
            </div>
            <div className="map-card">
              <iframe
                title="KRUSH location map"
                src="https://www.google.com/maps?q=George%20Street%20Sydney%20NSW&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BOOKING CTA (FR-25) ================= */}
      <section className="cta">
        <div className="container reveal">
          <h2>Hungry? <span className="accent">Book a Table.</span></h2>
          <p>Reserve online in seconds — free, instant confirmation, open 7 days.</p>
          <Link href="/booking" className="btn btn-primary">Book a Table 🍽</Link>
        </div>
      </section>
    </main>
  );
}
