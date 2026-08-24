import Link from "next/link";
import Image from "next/image";
import LogoMark from "@/components/LogoMark";
import Announce from "@/components/Announce";
import FeaturedSlider from "@/components/FeaturedSlider";
import ReviewForm from "@/components/ReviewForm";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import {
  formatTime,
  getAnnouncement,
  getCertifications,
  getGallery,
  getHours,
  getMenuWithStatus,
  getReviews,
  getSite,
  telHref,
} from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [announcement, menu, gallery, reviews, hours, certs, site] = await Promise.all([
    getAnnouncement(),
    getMenuWithStatus(),
    getGallery(),
    getReviews(),
    getHours(),
    getCertifications(),
    getSite(),
  ]);

  return (
    <main>
      <Announce data={announcement} />

      {/* ================= HERO (FR-01) ================= */}
      <section className="hero">
        <div className="container hero-cards">
          <div className="hero-card-left">
            <h1>
              {site.hero_heading} <span className="script">{site.hero_script}</span>
            </h1>
            <p className="lead">{site.hero_lead}</p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/booking" className="btn btn-primary">Book a Table</Link>
              <Link href="/menu" className="btn btn-ghost" style={{ borderColor: "#fff", color: "#fff" }}>
                Explore Our Menu
              </Link>
            </div>
          </div>

          <div className="hero-card-right">
            <Image
              src={site.hero_image}
              alt="Signature dish at The Pancake Club"
              width={1200}
              height={800}
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>

          <Link href="/booking" className="round-badge" aria-label="Book a table — open 7 days">
            <span className="disc"></span>
            <svg viewBox="0 0 120 120">
              <defs>
                <path id="badgeCircle" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
              </defs>
              <circle
                cx="60" cy="60" r="33"
                fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeDasharray="3.5 6" strokeLinecap="round"
              />
              <text>
                <textPath href="#badgeCircle">Book a table • open 7 days • est. 1999 •</textPath>
              </text>
            </svg>
            <span className="center-ic"><LogoMark size={44} /></span>
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

          <FeaturedSlider items={menu.items} />
        </div>
      </section>

      {/* ================= ABOUT / WELCOME (FR-03) ================= */}
      <section className="block" id="about" style={{ paddingTop: "1rem" }}>
        <div className="container about-grid">
          <div className="about-collage reveal">
            <Image src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=75" alt="Inside The Pancake Club" width={800} height={600} sizes="(min-width: 1024px) 25vw, 50vw" />
            <Image src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75" alt="Banana pancake stack" width={600} height={450} sizes="(min-width: 1024px) 12vw, 25vw" />
            <Image src="https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=75" alt="Pancakes with honey drizzle" width={600} height={450} sizes="(min-width: 1024px) 12vw, 25vw" />
          </div>
          <div className="reveal">
            <p className="kicker">Welcome to the Club</p>
            <h2 className="title">
              Fluffy. Golden.<br /><span className="accent">Fully Stacked.</span>
            </h2>
            <p className="section-lead">{site.about_text}</p>
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
                <Image src={p.image} alt={p.alt} width={700} height={500} sizes="(min-width: 1024px) 25vw, 50vw" />
              </Link>
            ))}
          </div>

          <div className="section-foot reveal">
            <Link href="/gallery" className="btn btn-ghost">See Full Gallery</Link>
          </div>
        </div>
      </section>

      {/* ================= REVIEWS CAROUSEL (FR-05) ================= */}
      <section className="block" id="reviews" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="kicker">★ 4.8 Average Rating</p>
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
            {certs.map((c) => (
              <div className="cert-badge" key={c.title}>
                <span className="ic">{c.icon}</span>
                <span><b>{c.title}</b><small>{c.subtitle}</small></span>
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
              <h3>Opening Hours</h3>
              <ul className="hours-list">
                {hours.map((h) => (
                  <li key={h.label}>
                    <span>{h.label}</span>
                    <span>{formatTime(h.opens)} – {formatTime(h.closes)}</span>
                  </li>
                ))}
              </ul>
              <h3>Find Us</h3>
              <div className="contact-lines">
                <span>{site.address}</span>
                <span>Phone: <a href={telHref(site.phone)}>{site.phone}</a></span>
                <span>Email: <a href={`mailto:${site.email}`}>{site.email}</a></span>
              </div>
            </div>
            <div className="map-card">
              <iframe
                title="The Pancake Club location map"
                src={site.map_embed}
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
          <Link href="/booking" className="btn btn-primary">Book a Table</Link>
        </div>
      </section>
    </main>
  );
}
