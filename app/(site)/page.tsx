import Link from "next/link";
import Image from "next/image";
import LogoMark from "@/components/LogoMark";
import CertIcon from "@/components/CertIcon";
import HeroShowcase from "@/components/HeroShowcase";
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
  getCategories,
  getCertifications,
  getGallery,
  getHours,
  getMenuWithStatus,
  getReviews,
  getSite,
  telHref,
} from "@/lib/api";
import { safeEmbedUrl, safeHref } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [announcement, campaigns, menu, gallery, reviews, hours, certs, site, categories] =
    await Promise.all([
      getAnnouncement(),
      getCampaigns(),
      getMenuWithStatus(),
      getGallery(),
      getReviews(),
      getHours(),
      getCertifications(),
      getSite(),
      getCategories(),
    ]);

  // slider heading is one editable string; the last word carries the accent colour
  const offersTitleWords = (site?.offers_title || "This Week's Offers").trim().split(" ");

  return (
    <main>
      {/* ================= HERO (FR-01) ================= */}
      <section className="hero">
        <div className="container hero-cards">
          <HeroShowcase
            heading={site.hero_heading}
            script={site.hero_script}
            lead={site.hero_lead}
            /* Book a Table is the primary action on the hero; takeaway ordering is in the top-right bar */
            ctas={[
              { href: "/booking", label: "BOOK A TABLE", variant: "primary" },
            ]}
            heroImage={site.hero_image}
            heroCutout={site.hero_cutout}
            dishes={menu.items.filter((m) => m.is_featured)}
          />
        </div>
      </section>

      {/* ================= MARQUEE ================= */}

      {/* ================= CAMPAIGN BAND ================= */}
      {announcement?.image &&
        (() => {
          const badge = countdownBadge(announcement.ends_at);
          // both voucher cards are staff-pickable by dish slug; blanks keep the
          // long-standing defaults (offer photo, then first featured dish)
          const pickedDish = (slug?: string) =>
            slug ? menu.items.find((m) => m.slug === slug && (m.photo || m.image)) : undefined;
          const dishCard = (d: (typeof menu.items)[number], tag: string) => ({
            href: `/menu/${d.slug}`,
            label: d.name,
            tag,
            img: d.photo || d.image,
          });
          const card1Dish = pickedDish(announcement.card1_dish);
          const card2Dish =
            pickedDish(announcement.card2_dish) ??
            menu.items.find((m) => m.is_featured && (m.photo || m.image));
          const cards = [
            card1Dish
              ? dishCard(card1Dish, "✨ Special")
              : {
                  href: safeHref(announcement.link_url, "/menu"),
                  label: "The Offer",
                  tag: "✨ Special",
                  img: announcement.image,
                },
            ...(card2Dish ? [dishCard(card2Dish, "🥞 Popular")] : []),
          ].slice(0, 2);

          return (
            <section className="promo">
              <div className="container">
                <div className="promo-band diner-promo-band reveal">
                  {/* Rotating Retro Starburst Badge */}
                  <div className="promo-starburst-badge">
                    <svg viewBox="0 0 100 100" className="starburst-rotate-svg" aria-hidden="true">
                      <path
                        id="starburstCircle"
                        d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                        fill="none"
                      />
                      <text>
                        <textPath href="#starburstCircle">
                          • SPECIAL DEAL • LIMITED TIME • HOT STACKS •
                        </textPath>
                      </text>
                    </svg>
                    <div className="starburst-center">
                      <span className="starburst-icon">🔥</span>
                      <b className="starburst-big">{badge.big === "ON" ? "DEAL" : badge.big}</b>
                      <span className="starburst-small">{badge.small === "now" ? "TODAY" : badge.small}</span>
                    </div>
                  </div>

                  {/* Middle: Headline, Kicker & CTA Button */}
                  <div className="promo-main">
                    <span className="promo-kicker">{site?.promo_kicker || "TODAY'S FEATURED SPECIAL"}</span>
                    <h2 className="promo-head">{announcement.message}</h2>
                    {announcement.link_url && (
                      <Link href={safeHref(announcement.link_url, "/menu")} className="promo-cta-btn">
                        <span>{announcement.link_text || "EXPLORE THE MENU"}</span>
                        <span className="promo-arrow">→</span>
                      </Link>
                    )}
                  </div>

                  {/* Right: 2 Interactive Voucher Ticket Cards */}
                  <div className="promo-cards">
                    {cards.map((c, i) => (
                      <Link
                        key={c.href + i}
                        href={c.href}
                        className={`promo-ticket-card ${i === 1 ? "tilt-card" : ""}`}
                      >
                        <div className="ticket-top-tag">
                          <span>{c.tag}</span>
                          <span className="ticket-open-icon">↗</span>
                        </div>
                        <div className="ticket-img-frame">
                          <Image
                            src={c.img}
                            alt={c.label}
                            fill
                            sizes="(min-width: 1024px) 220px, 45vw"
                            className="ticket-img"
                          />
                        </div>
                        <span className="ticket-dish-title">{c.label}</span>
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
        <Sticker
          kind="sparkle"
          color="var(--pink)"
          size={56}
          style={{ top: "4rem", left: "3%", transform: "rotate(12deg)" }}
        />
        <Sticker
          kind="squiggle"
          color="var(--yellow)"
          size={84}
          style={{ top: "6rem", right: "4%", transform: "rotate(-8deg)" }}
        />
        <div className="container">
          <div className="reveal">
            <FavouritesRail
              items={menu.items}
              categories={categories}
              variant="v1"
              live={menu.live && site.online_ordering_enabled}
              /* a single element, not a fragment: RSC serialises multi-child
                 fragments into an unkeyed array when crossing to a client component */
              title={
                <div>
                  <p className="kicker">Crowd Favourites</p>
                  <h2 className="title">
                    Pick your <span className="accent">favorites</span>
                  </h2>
                  <p className="fav-sub">Top pick straight from our menu</p>
                </div>
              }
              cta={{ href: "/menu", label: "VIEW FULL MENU" }}
            />
          </div>
        </div>
      </section>

      {/* ================= CAMPAIGNS ================= */}
      {campaigns.length > 0 && (
        <section className="block band-butter" id="offers">
          <Sticker kind="sparkle" color="var(--yellow-deep)" size={44} style={{ top: "5rem", left: "4%", transform: "rotate(-10deg)" }} />
          <Sticker
            kind="arc"
            color="var(--pink)"
            size={90}
            style={{ bottom: "3rem", right: "5%", transform: "rotate(180deg)" }}
          />
          <div className="container">
            <CampaignSlider
              items={campaigns}
              title={
                <div className="reveal" style={{ textAlign: "center" }}>
                  <p className="kicker">{site?.offers_kicker || "On right now"}</p>
                  <h2 className="title">
                    {offersTitleWords.slice(0, -1).join(" ")}{" "}
                    <span className="accent">{offersTitleWords[offersTitleWords.length - 1]}</span>
                  </h2>
                  <p className="fav-sub" style={{ marginTop: "0.4rem" }}>Fresh off the griddle</p>
                </div>
              }
            />
          </div>
        </section>
      )}

      {/* ================= GALLERY PREVIEW (FR-04) ================= */}
      <section className="block band-lavender" id="gallery">
        <Sticker
          kind="sparkle"
          color="var(--yellow)"
          size={44}
          style={{ top: "5rem", right: "6%", transform: "rotate(-15deg)" }}
        />
        <Sticker
          kind="ring"
          color="var(--pink)"
          size={60}
          style={{ bottom: "5rem", left: "4%" }}
        />
        <div className="container">
          <div className="gal-head reveal">
            <h2 className="title inline">
              From Our <span className="accent">Gallery</span>
            </h2>
            <Link href="/gallery" className="btn btn-primary">
              See Full Gallery
            </Link>
          </div>

          {/* ================= Scrapbook Polaroid Mosaic (Option 1) ================= */}
          <div className="gallery-mosaic reveal">
            {gallery.slice(0, 6).map((p, i) => {
              const tapes = ["tape-left", "tape-right", "tape-center", "tape-left", "tape-pin", "tape-right"];
              const tape = tapes[i % tapes.length];
              const stamps = ["🥞 100% Fluffy", "✨ Geelong Vibe", "☕ Fresh Brew", "🍓 Berry Sweet", "💛 Café Mood", "🍯 Golden Maple"];
              const stamp = stamps[i % stamps.length];
              const isHero = i === 0;

              return (
                <Link
                  href="/gallery"
                  key={p.image + i}
                  className={`mosaic-polaroid ${isHero ? "mosaic-hero" : ""}`}
                >
                  {/* Washi Tape Accent */}
                  <div className={`washi-tape ${tape}`} aria-hidden="true" />

                  {/* Corner Stamp */}
                  {(isHero || i === 2 || i === 4) && (
                    <div className="mosaic-stamp" aria-hidden="true">
                      {stamp}
                    </div>
                  )}

                  <div className="mosaic-img-box">
                    <Image
                      src={p.image}
                      alt={p.alt || p.caption || "The Pancake Club gallery"}
                      width={900}
                      height={700}
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      style={{
                        objectPosition: `50% ${
                          p.focus === "top" ? "18%" : p.focus === "bottom" ? "82%" : "50%"
                        }`,
                      }}
                    />
                    <div className="mosaic-hover-badge">
                      <span>Explore Snap 📸</span>
                    </div>
                  </div>

                  {/* Handwritten Chin on the Hero Shot */}
                  {isHero && p.caption && (
                    <div className="mosaic-hero-chin">
                      <p className="mosaic-hero-caption">{p.caption}</p>
                      <span className="mosaic-hero-tag">📍 Geelong, Victoria</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= REVIEWS CAROUSEL (FR-05) ================= */}
      <section className="block band-blush" id="reviews">
        <Sticker
          kind="squiggle"
          color="var(--lavender)"
          size={80}
          style={{ top: "4rem", left: "4%", transform: "rotate(10deg)" }}
        />
        <Sticker
          kind="sparkle"
          color="var(--green)"
          size={40}
          style={{ bottom: "6rem", right: "5%" }}
        />
        <div className="container">
          <div className="reveal" style={{ textAlign: "center" }}>
            <h2 className="title">
              What our <span className="accent">guests say</span>
            </h2>
          </div>
          <ReviewsCarousel reviews={reviews} />
          <ReviewForm />
        </div>
      </section>

      {/* ================= HOURS + LOCATION (FR-07) ================= */}
      <section className="block band-mint" id="contact">
        <Sticker
          kind="arc"
          color="var(--yellow)"
          size={80}
          style={{ top: "3rem", left: "3%", transform: "rotate(-20deg)" }}
        />
        <Sticker
          kind="ring"
          color="var(--lavender)"
          size={52}
          style={{ bottom: "4rem", right: "4%" }}
        />
        <div className="container">
          <div className="reveal" style={{ textAlign: "center", marginBottom: "2.8rem" }}>
            <p className="kicker">Come on over</p>
            <h2 className="title inline">
              Hours &amp; <span className="accent">Location</span>
            </h2>
            <p className="section-lead" style={{ margin: "0.5rem auto 0", maxWidth: "540px" }}>
              Drop by for brunch or an afternoon pancake fix in the heart of Geelong
            </p>
          </div>

          <div className="hours-grid reveal">
            {/* Retro Diner Chalkboard & Hours Note */}
            <div className="hours-card diner-hours-card">
              <div className="hours-card-top">
                <h3>⏰ Opening Hours</h3>
                <span className="hours-card-badge">Dine-in &amp; Takeaway</span>
              </div>
              <ul className="hours-list">
                {hours.map((h) => (
                  <li key={h.label}>
                    <span className="hours-day">{h.label}</span>
                    <span className="hours-time">
                      {formatTime(h.opens)} – {formatTime(h.closes)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="diner-find-box">
                <h4 className="find-title">📍 Find us in Geelong, Victoria</h4>
                <div className="contact-lines">
                  <span className="contact-item">
                    <strong>Address:</strong> {site.address}
                  </span>
                  <span className="contact-item">
                    <strong>Phone:</strong>{" "}
                    <a href={telHref(site.phone)} className="contact-link">
                      {site.phone}
                    </a>
                  </span>
                  <span className="contact-item">
                    <strong>Email:</strong>{" "}
                    <a href={`mailto:${site.email}`} className="contact-link">
                      {site.email}
                    </a>
                  </span>
                </div>
                {site.show_transit_badges && lines(site.transit_badges).length > 0 && (
                  <div className="transit-badges">
                    {lines(site.transit_badges).map((chip) => (
                      <span key={chip} className="transit-chip">{chip}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Geelong Map Card */}
            <div className="map-card diner-map-card">
              <div className="map-frame">
                <iframe
                  title="The Pancake Club location map"
                  src={safeEmbedUrl(site.map_embed)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="map-action-bar">
                <div className="map-location-info">
                  <span className="map-spot-name">Pancake Club Geelong</span>
                  <span className="map-spot-addr">{site.address}</span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(site.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary map-directions-btn"
                >
                  GET DIRECTIONS ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CERTIFICATIONS (FR-06) — Vintage Farmers Market Quality Seals ========== */}
      {certs.length > 0 && (
        <section className="certs-strip-sec" id="certifications">
          <Sticker kind="ring" color="var(--yellow)" size={40} style={{ top: "1.5rem", right: "6%" }} />
          <div className="container">
            <div style={{ textAlign: "center" }}>
              <p className="kicker">FEEL GOOD ABOUT EVERY BITE</p>
              <h3 className="cert-section-heading">Certified &amp; award winning quality</h3>
            </div>
            <div className="cert-strip reveal">
              {certs.map((c) => (
                <div className="cert-badge quality-seal-badge" key={c.title}>
                  <span className="ic">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.title}
                        width={48}
                        height={48}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <CertIcon name={c.icon} />
                    )}
                  </span>
                  <div className="cert-info">
                    <b>{c.title}</b>
                    <small>{c.subtitle}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= BOOKING CTA (FR-25) ================= */}
      <section className="cta diner-cta-banner">
        <Sticker
          kind="sparkle"
          color="var(--yellow-deep)"
          size={50}
          style={{ top: "2rem", left: "6%", transform: "rotate(-10deg)" }}
        />
        <Sticker
          kind="arc"
          color="var(--yellow)"
          size={70}
          style={{ bottom: "2rem", right: "6%", transform: "rotate(180deg)" }}
        />
        <div className="container reveal">
          <p className="cta-kicker">READY FOR A GOOD TIME</p>
          <h2>
            {site.cta_heading} <span className="accent">{site.cta_script}</span>
          </h2>
          <p className="cta-lead-text">{site.cta_lead}</p>
          <Link
            href={safeHref(site.cta_button_url, "/booking")}
            className="btn btn-primary cta-action-btn"
          >
            <span>🥞 {site.cta_button_label || "BOOK A TABLE"}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
