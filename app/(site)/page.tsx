import Link from "next/link";
import Image from "next/image";
import LogoMark from "@/components/LogoMark";
import CertIcon from "@/components/CertIcon";
import HeroShowcase from "@/components/HeroShowcase";
import Marquee from "@/components/Marquee";
import CampaignSlider from "@/components/CampaignSlider";
import FavouritesRail from "@/components/FavouritesRail";
import ReviewForm from "@/components/ReviewForm";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import Sticker from "@/components/Sticker";
import {
  countdownBadge,
  getAnnouncement,
  getCampaigns,
  lines,
  formatTime,
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
  const [announcement, campaigns, menu, gallery, reviews, hours, certs, site] = await Promise.all([
    getAnnouncement(),
    getCampaigns(),
    getMenuWithStatus(),
    getGallery(),
    getReviews(),
    getHours(),
    getCertifications(),
    getSite(),
  ]);

  return (
    <main>

      {/* ================= HERO (FR-01) ================= */}
      <section className="hero">
        <div className="container hero-cards">
          <HeroShowcase
            heading={site.hero_heading}
            script={site.hero_script}
            lead={site.hero_lead}
            ctas={[
              { href: "/booking", label: "Book a Table", variant: "primary" },
              { href: "/menu", label: "Explore Our Menu", variant: "ghost" },
            ]}
            heroImage={site.hero_image}
            heroCutout={site.hero_cutout}
            dishes={menu.items.filter((m) => m.is_featured)}
          />

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
      {/* <Marquee /> */}

      {/* ================= CAMPAIGN BAND ================= */}
      {announcement?.image && (() => {
        const badge = countdownBadge(announcement.ends_at);
        const cards = [
          { href: announcement.link_url || "/menu", label: "The offer", img: announcement.image },
          ...menu.items
            .filter((m) => m.is_featured && (m.photo || m.image))
            .map((d) => ({ href: `/menu/${d.slug}`, label: d.name, img: d.photo || d.image })),
        ].slice(0, 2);

        return (
          <section className="promo">
            <div className="container">
              <div className="promo-band reveal">
                <div className="promo-badge">
                  <b>{badge.big}</b>
                  <span>{badge.small}</span>
                </div>

                <div className="promo-main">
                  <h2 className="promo-head">{announcement.message}</h2>
                  {announcement.link_url && (
                    <Link href={announcement.link_url} className="promo-cta">
                      {announcement.link_text || "Find out more"}
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </Link>
                  )}
                </div>

                <div className="promo-cards">
                  {cards.map((c) => (
                    <Link key={c.href} href={c.href} className="promo-card">
                      <span className="pc-top">
                        <b>{c.label}</b>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M7 17L17 7M9 7h8v8" />
                        </svg>
                      </span>
                      <span className="pc-ph">
                        <Image src={c.img} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ================= FEATURED DISHES (FR-02) ================= */}
      <section className="block" id="featured">
        <Sticker kind="sparkle" color="var(--pink)" size={56} style={{ top: "4rem", left: "3%", transform: "rotate(12deg)" }} />
        <Sticker kind="squiggle" color="var(--yellow)" size={84} style={{ top: "6rem", right: "4%", transform: "rotate(-8deg)" }} />
        <div className="container">
          <div className="reveal">
            <FavouritesRail
              items={menu.items}
              variant="v1"
              /* a single element, not a fragment: RSC serialises multi-child
                 fragments into an unkeyed array when crossing to a client component */
              title={
                <div>
                  <p className="kicker">Crowd Favourites</p>
                  <h2 className="title">Our <span className="accent">Favourites</span></h2>
                  <p className="fav-sub">Top picks straight off our menu.</p>
                </div>
              }
              cta={{ href: "/menu", label: "View Full Menu" }}
            />
          </div>
        </div>
      </section>

      {/* ================= CAMPAIGNS ================= */}
      {campaigns.length > 0 && (
        <section className="block band-butter" id="offers">
          <Sticker kind="arc" color="var(--pink)" size={90} style={{ bottom: "3rem", right: "5%", transform: "rotate(180deg)" }} />
          <div className="container">
            <div className="reveal" style={{ textAlign: "center" }}>
              <p className="kicker">On Right Now</p>
              <h2 className="title">This Week&apos;s <span className="accent">Offers</span></h2>
            </div>
            {/* photo left, the offer right — one at a time */}
            <CampaignSlider items={campaigns} />
          </div>
        </section>
      )}

      {/* ================= GALLERY PREVIEW (FR-04) ================= */}
      <section className="block band-lavender" id="gallery">
        <Sticker kind="sparkle" color="var(--yellow)" size={44} style={{ top: "5rem", right: "6%", transform: "rotate(-15deg)" }} />
        <Sticker kind="ring" color="var(--pink)" size={60} style={{ bottom: "5rem", left: "4%" }} />
        <div className="container">
          <div className="gal-head reveal">
            <h2 className="title inline">From Our <span className="accent">Gallery</span></h2>
            <Link href="/gallery" className="btn btn-primary">See Full Gallery</Link>
          </div>

          {/* asymmetric mosaic — a photo wall, not another uniform card row */}
          <div className="gallery-mosaic reveal">
            {gallery.slice(0, 6).map((p) => (
              <Link href="/gallery" key={p.image}>
                {/* cells crop to a fixed shape; the photo's own focus decides
                    which part survives instead of always taking the middle */}
                <Image
                  src={p.image}
                  alt={p.alt || p.caption}
                  width={900}
                  height={700}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  style={{ objectPosition: `50% ${p.focus === "top" ? "18%" : p.focus === "bottom" ? "82%" : "50%"}` }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= REVIEWS CAROUSEL (FR-05) ================= */}
      <section className="block band-blush" id="reviews">
        <Sticker kind="squiggle" color="var(--lavender)" size={80} style={{ top: "4rem", left: "4%", transform: "rotate(10deg)" }} />
        <Sticker kind="sparkle" color="var(--green)" size={40} style={{ bottom: "6rem", right: "5%" }} />
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <p className="stat-chip"><span className="star">★</span> 4.8 average from happy guests</p>
            <h2 className="title">What Our <span className="accent">Guests Say</span></h2>
          </div>
          <ReviewsCarousel reviews={reviews} />
          <ReviewForm />
        </div>
      </section>

      {/* ================= HOURS + LOCATION (FR-07) ================= */}
      <section className="block band-mint" id="contact">
        <Sticker kind="arc" color="var(--yellow)" size={80} style={{ top: "3rem", left: "3%", transform: "rotate(-20deg)" }} />
        <Sticker kind="ring" color="var(--lavender)" size={52} style={{ bottom: "4rem", right: "4%" }} />
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
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

      {/* ========== CERTIFICATIONS (FR-06) — quiet trust strip before the CTA ========== */}
      {certs.length > 0 && (
        <section className="certs-strip-sec" id="certifications">
          <div className="container">
            <div style={{ textAlign: "center" }}>
              <p className="kicker">Certified &amp; Award-Winning</p>
            </div>
            <div className="cert-strip reveal">
              {certs.map((c) => (
                <div className="cert-badge" key={c.title}>
                  <span className="ic"><CertIcon name={c.icon} /></span>
                  <span><b>{c.title}</b><small>{c.subtitle}</small></span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= BOOKING CTA (FR-25) ================= */}
      <section className="cta">
        <div className="container reveal">
          <h2>{site.cta_heading} <span className="accent">{site.cta_script}</span></h2>
          <p>{site.cta_lead}</p>
          <Link href={site.cta_button_url || "/booking"} className="btn btn-primary">
            {site.cta_button_label}
          </Link>
        </div>
      </section>
    </main>
  );
}
