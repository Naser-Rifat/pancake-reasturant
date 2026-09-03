"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CERT_ICONS } from "@/components/CertIcon";
import CertIcon from "@/components/CertIcon";
import {
  type AdminSiteSettings,
  type AdminAnnouncement,
  type AdminCertification,
  type AdminGalleryPhoto,
  type AdminHomeStep,
  type AdminMenuItem,
} from "@/lib/admin-api";

const DEFAULT_DEAL_PHOTO = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80";

export default function PreviewPage() {
  const [section, setSection] = useState<string>("hero");
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [site, setSite] = useState<AdminSiteSettings>({
    hero_heading: "Stack Into",
    hero_script: "Happiness",
    hero_lead: "We flip the best homemade pancakes in Sydney — griddled to order, stacked high, drowned in real maple.",
    hero_image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400&q=85",
    hero_cutout: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    about_text: "",
    about_heading: "",
    about_script: "",
    about_image_1: "",
    about_image_2: "",
    about_image_3: "",
    about_points: "",
    cta_heading: "Hungry?",
    cta_script: "Book a Table.",
    cta_lead: "Reserve online in seconds — free, instant confirmation, open 7 days.",
    cta_button_label: "Book a Table",
    cta_button_url: "/booking",
    marquee_words: "",
    footer_tagline: "Fluffy stacks · real maple · est. 1999",
    menu_hero_heading: "Stacks On",
    menu_hero_script: "Stacks.",
    menu_hero_lead: "Handcrafted pancakes made fresh with local dairy and authentic maple.",
    gallery_hero_kicker: "Feast Your Eyes",
    gallery_hero_heading: "The",
    gallery_hero_script: "Gallery.",
    gallery_hero_lead: "Our food, our space, and the good times in between.",
    booking_hero_kicker: "Reserve Online — Free & Instant",
    booking_hero_heading: "Book a",
    booking_hero_script: "Table.",
    booking_hero_lead: "Pick a date, pick a time — we'll have the griddle hot when you arrive.",
    address: "123 Pancake Lane, Sydney",
    phone: "0400000000",
    whatsapp: "",
    email: "hello@thepancakeclub.com.au",
    abn: "",
    map_embed: "",
    instagram_url: "",
    facebook_url: "",
    uber_eats_url: "",
    online_ordering_enabled: true,
    online_ordering_disabled_message: "",
    timezone: "Australia/Sydney",
    theme: "maple",
    custom_primary: "#763a12",
    custom_accent: "#e08600",
  });

  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>({
    id: 1,
    message: "Weekend Brunch Pass — 20% Off All Stacks Before 11am!",
    details: "Saturday & Sunday · early birds enjoy 20% discount",
    link_text: "EXPLORE MENU",
    link_url: "/menu",
    image: DEFAULT_DEAL_PHOTO,
    is_active: true,
    starts_at: null,
    ends_at: null,
  });

  // Custom customizable section titles from admin
  const [section1Kicker, setSection1Kicker] = useState<string>("✨ TODAY'S FEATURED SPECIAL");
  const [section2Kicker, setSection2Kicker] = useState<string>("On Right Now");
  const [section2Title, setSection2Title] = useState<string>("This Week's Offers");
  const [customBadge, setCustomBadge] = useState<string>("");

  const [certs, setCerts] = useState<AdminCertification[]>([
    { id: 1, icon: "medal", title: "100% Pure Canadian Maple", subtitle: "Grade A dark amber", is_active: true, sort_order: 0 },
    { id: 2, icon: "leaf", title: "Free Range Eggs", subtitle: "Locally sourced", is_active: true, sort_order: 1 },
    { id: 3, icon: "trophy", title: "Award Winning Stacks", subtitle: "Sydney's favourite 2024", is_active: true, sort_order: 2 },
  ]);

  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>([]);
  const [steps, setSteps] = useState<AdminHomeStep[]>([
    { id: 1, label: "01", title: "Order Online", text: "Pick your favourite stack and customizations.", image: "", sort_order: 0 },
    { id: 2, label: "02", title: "We Griddle Fresh", text: "Made to order with real maple and fresh dairy.", image: "", sort_order: 1 },
    { id: 3, label: "03", title: "Pick Up Hot", text: "Grab your warm stack right on time.", image: "", sort_order: 2 },
  ]);

  const [dishes, setDishes] = useState<AdminMenuItem[]>([
    {
      slug: "signature-buttermilk",
      name: "Classic Buttermilk Stack",
      description: "Our signature stack with whipped butter & pure maple.",
      price: "14.00",
      tag: "sweet",
      heat: "none",
      kcal: 480,
      protein_g: 14,
      prep_time: "10m",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
      photo: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
      is_featured: true,
      is_available: true,
      sort_order: 0,
    },
    {
      slug: "berry-bliss",
      name: "Berry Bliss",
      description: "Organic blueberries, strawberries, maple syrup, and chantilly cream.",
      price: "17.00",
      tag: "sweet",
      heat: "none",
      kcal: 520,
      protein_g: 12,
      prep_time: "12m",
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      photo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      is_featured: true,
      is_available: true,
      sort_order: 1,
    },
  ]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== "PANCAKE_PREVIEW_SYNC") return;
      const {
        section: s,
        site: nextSite,
        announcement: nextAnn,
        section1Kicker: nextK1,
        section2Kicker: nextK2,
        section2Title: nextT2,
        customBadge: nextBadge,
        certs: nextCerts,
        photos: nextPhotos,
        steps: nextSteps,
        dishes: nextDishes,
      } = e.data;
      if (s) setSection(s);
      if (nextSite) setSite(nextSite);
      if (nextAnn !== undefined) setAnnouncement(nextAnn);
      if (nextK1 !== undefined) setSection1Kicker(nextK1);
      if (nextK2 !== undefined) setSection2Kicker(nextK2);
      if (nextT2 !== undefined) setSection2Title(nextT2);
      if (nextBadge !== undefined) setCustomBadge(nextBadge);
      if (nextCerts) setCerts(nextCerts);
      if (nextPhotos) setPhotos(nextPhotos);
      if (nextSteps) setSteps(nextSteps);
      if (nextDishes && Array.isArray(nextDishes) && nextDishes.length > 0) setDishes(nextDishes);
    };

    window.addEventListener("message", handler);
    window.parent?.postMessage({ type: "PANCAKE_PREVIEW_READY" }, "*");

    const params = new URLSearchParams(window.location.search);
    const qSection = params.get("section");
    if (qSection) setSection(qSection);

    return () => window.removeEventListener("message", handler);
  }, []);

  // Build slides for Hero
  const featuredDishes = dishes.filter((m) => m.is_featured);
  const cheapest = featuredDishes.length
    ? Math.min(...featuredDishes.map((d) => parseFloat(d.price)).filter((n) => !isNaN(n)))
    : 14;

  const slides = [
    {
      src: site.hero_image,
      alt: "Signature dish at The Pancake Club",
      label: "Signature Stack",
      price: cheapest ? `From $${cheapest}` : "From $14",
    },
    ...featuredDishes.slice(0, 2).map((d) => ({
      src: d.photo || d.image,
      alt: `${d.name} pancakes`,
      label: d.name,
      price: `$${parseFloat(d.price)}`,
    })),
  ].filter((s) => s.src);

  const currentSlide = slides[activeSlide] ?? slides[0];
  const chip = site.hero_cutout || featuredDishes.find((d) => d.image)?.image;
  const headingWords = site.hero_heading ? site.hero_heading.trim().split(/\s+/) : ["Stack", "Into"];

  // Helper for safe photo URL
  const dealPhotoSrc =
    announcement?.image &&
    (announcement.image.startsWith("http://") ||
      announcement.image.startsWith("https://") ||
      announcement.image.startsWith("/"))
      ? announcement.image
      : DEFAULT_DEAL_PHOTO;

  // Compute live banner kicker from custom admin settings or fallback
  const displayKicker1 =
    !announcement?.is_active
      ? "⏸️ CURRENTLY HIDDEN"
      : section1Kicker?.trim() || "✨ TODAY'S FEATURED SPECIAL";

  const displayBadgeTag =
    customBadge?.trim() ||
    (announcement?.is_active ? "SPECIAL" : "DRAFT");

  return (
    <div className="preview-container bg-[var(--cream)] text-[var(--ink)] antialiased">
      {/* 
        CRUCIAL: Hide global navbar, top announcement marquee, footer, and whatsapp float in preview mode 
        and prevent unwanted scrollbars inside the iframe!
      */}
      <style jsx global>{`
        html,
        body {
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
          background: transparent !important;
        }

        .announce,
        header:has(.announce),
        .nav-wrap,
        .site-nav,
        .nav-pill,
        .hero-nav,
        footer,
        .site-footer,
        .whatsapp-float {
          display: none !important;
        }

        .preview-container {
          overflow: hidden !important;
          padding: 8px !important;
        }

        .preview-container .promo-band {
          padding: 1.5rem 2.2rem !important;
          margin: 0.25rem auto !important;
          border-radius: 24px !important;
          box-shadow: 0 10px 30px rgba(33, 26, 20, 0.18) !important;
        }

        .preview-container .promo-head {
          font-size: clamp(1.35rem, 2.2vw, 1.9rem) !important;
          line-height: 1.1 !important;
          margin: 0.35rem 0 !important;
        }

        .preview-container .camp-slide {
          margin: 0.25rem auto !important;
        }

        /* 1:1 Pixel-Perfect Hero Banner styling matching user screenshot */
        .preview-hero-card {
          position: relative;
          min-height: 480px;
          border-radius: 28px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 2.5rem;
          box-shadow: 0 12px 36px rgba(33, 26, 20, 0.12);
        }

        .preview-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .preview-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center right;
        }

        .preview-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            rgba(26, 17, 9, 0.92) 0%,
            rgba(26, 17, 9, 0.84) 36%,
            rgba(26, 17, 9, 0.5) 60%,
            rgba(26, 17, 9, 0.15) 100%
          );
          z-index: 1;
        }

        .preview-hero-content {
          position: relative;
          z-index: 2;
          max-width: 580px;
        }

        .preview-hero-h1 {
          font-family: var(--font-display, Luckiest Guy, cursive);
          font-size: clamp(2.4rem, 4.8vw, 4.2rem);
          line-height: 0.95;
          color: #fffdf9;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }

        .preview-head-line {
          display: block;
        }

        .preview-head-chip {
          display: inline-grid;
          place-items: center;
          width: 0.72em;
          height: 0.72em;
          border-radius: 50%;
          background: #aa4c0a;
          vertical-align: -0.03em;
          overflow: hidden;
          margin: 0 0.1em;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .preview-head-chip img {
          width: 90%;
          height: 90%;
          object-fit: cover;
        }

        .preview-script-word {
          display: block;
          font-family: var(--font-script, Pacifico, cursive);
          text-transform: none;
          font-size: 0.68em;
          color: #efbf38;
          transform: rotate(-2deg);
          margin-top: 0.25rem;
          line-height: 1.2;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }

        .preview-hero-lead {
          color: rgba(248, 242, 224, 0.9);
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 25rem;
          margin: 1.2rem 0 1.6rem;
          font-weight: 500;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        .preview-hero-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
        }

        .preview-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #efbf38;
          color: #211a14;
          font-weight: 900;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.75rem 1.6rem;
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(239, 191, 56, 0.35);
          transition: transform 0.2s;
        }

        .preview-hero-thumbs {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .preview-thumb-btn {
          width: 44px;
          height: 44px;
          padding: 2px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(6px);
          cursor: pointer;
          overflow: hidden;
          position: relative;
          transition: all 0.2s;
        }

        .preview-thumb-btn.on {
          border-color: #efbf38;
          box-shadow: 0 0 0 2px rgba(239, 191, 56, 0.5);
          transform: scale(1.05);
        }

        .preview-thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }

        .preview-price-pill {
          position: absolute;
          right: 24px;
          bottom: 24px;
          z-index: 2;
          background: rgba(33, 26, 20, 0.88);
          color: #fffdf9;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. HERO PREVIEW (100% EXACT REPRODUCTION OF USER SCREENSHOT)              */}
      {/* ========================================================================= */}
      {section === "hero" && (
        <div className="preview-hero-card">
          {/* Full-bleed background photo & scrim */}
          <div className="preview-hero-bg">
            {currentSlide?.src && (
              <Image
                key={currentSlide.src}
                src={currentSlide.src}
                alt={currentSlide.alt || "Hero Stack"}
                fill
                priority
                sizes="100vw"
              />
            )}
            <div className="preview-hero-scrim" />
          </div>

          {/* Left Text and CTA Content */}
          <div className="preview-hero-content">
            <h1 className="preview-hero-h1">
              {headingWords.length >= 2 ? (
                <>
                  <span className="preview-head-line">{headingWords[0]}</span>
                  <span className="preview-head-line">
                    {headingWords.slice(1).join(" ")}
                    {chip && (
                      <span className="preview-head-chip">
                        <Image src={chip} alt="" width={80} height={80} />
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  {site.hero_heading}
                  {chip && (
                    <span className="preview-head-chip">
                      <Image src={chip} alt="" width={80} height={80} />
                    </span>
                  )}
                </>
              )}
              <span className="preview-script-word">{site.hero_script}</span>
            </h1>

            <p className="preview-hero-lead">{site.hero_lead}</p>

            <div className="preview-hero-actions">
              <Link href="/booking" className="preview-cta-btn">
                <span>Book a Table</span>
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Link>

              {slides.length > 1 && (
                <div className="preview-hero-thumbs">
                  {slides.map((s, idx) => (
                    <button
                      key={s.src + idx}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`preview-thumb-btn ${idx === activeSlide ? "on" : ""}`}
                      title={s.label}
                    >
                      <Image src={s.src} alt={s.label} width={40} height={40} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Floating Price Pill on the Right */}
          {currentSlide?.price && (
            <div className="preview-price-pill">{currentSlide.price}</div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2A. CAMPAIGN FORMAT 1: TOP RETRO DINER PROMO BAND                         */}
      {/* ========================================================================= */}
      {section === "deals" && (
        <section className="promo" style={{ padding: "0" }}>
          <div className="container" style={{ padding: "0" }}>
            <div className="promo-band diner-promo-band reveal visible" style={{ margin: "0" }}>
              {/* Rotating Retro Starburst Badge */}
              <div className="promo-starburst-badge">
                <svg viewBox="0 0 100 100" className="starburst-rotate-svg" aria-hidden="true">
                  <path
                    id="starburstCirclePrev"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="none"
                  />
                  <text>
                    <textPath href="#starburstCirclePrev">
                      • SPECIAL DEAL • LIMITED TIME • HOT STACKS •
                    </textPath>
                  </text>
                </svg>
                <div className="starburst-center">
                  <span className="starburst-icon">🔥</span>
                  <b className="starburst-big">DEAL</b>
                  <span className="starburst-small">TODAY</span>
                </div>
              </div>

              {/* Middle: Headline, Kicker & CTA Button */}
              <div className="promo-main">
                <span className="promo-kicker">
                  {displayKicker1}
                </span>
                <h2 className="promo-head">{announcement?.message || "Weekend Brunch Pass — 20% Off!"}</h2>
                {announcement?.details && (
                  <p style={{ color: "rgba(248, 242, 224, 0.9)", fontSize: "0.95rem", margin: "0.35rem 0 0.85rem", fontWeight: 500 }}>
                    {announcement.details}
                  </p>
                )}
                <div className="promo-action" style={{ marginTop: "0.75rem" }}>
                  <Link href={announcement?.link_url || "/menu"} className="promo-cta-btn">
                    <span>{announcement?.link_text || "EXPLORE MENU"}</span>
                    <span className="promo-arrow">→</span>
                  </Link>
                </div>
              </div>

              {/* Right: Voucher Ticket Card with Photo */}
              <div className="promo-cards">
                <div className="promo-ticket-card tilt-card" style={{ width: "160px", minWidth: "150px" }}>
                  <div className="ticket-top-tag">
                    <span>✨ {displayBadgeTag}</span>
                    <span className="ticket-open-icon">↗</span>
                  </div>
                  <div className="ticket-img-frame" style={{ position: "relative", width: "100%", height: "115px" }}>
                    <Image
                      src={dealPhotoSrc}
                      alt="Deal"
                      fill
                      sizes="160px"
                      className="ticket-img object-cover"
                    />
                  </div>
                  <span className="ticket-dish-title" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
                    {announcement?.link_text || "The Offer"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2B. CAMPAIGN FORMAT 2: WEEKLY OFFERS COUPON TICKET SLIDER                 */}
      {/* ========================================================================= */}
      {section === "deals_slider" && (
        <section style={{ padding: "0" }}>
          <div className="container" style={{ padding: "0" }}>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <p style={{ color: "var(--pink-deep)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.06em", margin: 0 }}>
                {section2Kicker?.trim() || "On Right Now"}
              </p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--ink)", margin: "0.1rem 0" }}>
                {section2Title?.trim() || "This Week's Offers"}
              </h2>
            </div>

            <div className="camp" style={{ maxWidth: "800px", margin: "0 auto" }}>
              <article className="camp-slide diner-craft-ticket">
                {/* Left: Food photography */}
                <div className="camp-left">
                  <div className="camp-shot">
                    <Image
                      src={dealPhotoSrc}
                      alt="Offer"
                      fill
                      sizes="300px"
                      className="camp-shot-img object-cover"
                    />
                  </div>
                </div>

                {/* Scissors icon on tear line */}
                <span className="camp-deco-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M20 4 8.5 15.5" />
                    <path d="M14.5 9.5 20 20" />
                    <path d="M8.5 8.5 12 12" />
                  </svg>
                </span>

                {/* Right: Handcrafted Diner Copy */}
                <div className="camp-copy">
                  <span className="camp-script-eyebrow">
                    ~ Fresh off the Griddle ~
                  </span>

                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.45rem", color: "var(--ink)", fontWeight: 400, lineHeight: 1.15, margin: "0.3rem 0" }}>
                    {announcement?.message || "Weekend Brunch Pass — 20% Off!"}
                  </h3>

                  {announcement?.details && (
                    <p className="camp-details" style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.3rem 0 0.8rem" }}>
                      {announcement.details}
                    </p>
                  )}

                  <div className="camp-actions-row">
                    <Link href={announcement?.link_url || "/menu"} className="camp-cta">
                      <span>{announcement?.link_text || "Explore Menu & Deals"}</span>
                      <ChevronRight size={16} strokeWidth={2.5} className="camp-btn-arrow" />
                    </Link>
                  </div>

                  {/* Vintage Rubber Stamp Watermark */}
                  <div className="camp-vintage-stamp" aria-hidden="true">
                    <span>FLUFFY</span>
                    <b>{displayBadgeTag.toUpperCase()}</b>
                    <small>SYDNEY</small>
                  </div>

                  <span className="camp-botanical" aria-hidden="true" />
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. PHOTO MOSAIC PREVIEW                                                   */}
      {/* ========================================================================= */}
      {section === "mosaic" && (
        <section style={{ padding: "8px 0" }}>
          <div className="container" style={{ padding: "0" }}>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <span className="script" style={{ color: "var(--berry)", fontSize: "1.6rem" }}>
                Feast your eyes
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--ink)", margin: 0 }}>
                The Pancake Gallery
              </h2>
            </div>
            <div className="mosaic-grid">
              {photos.slice(0, 6).map((p, idx) => (
                <div key={p.id || idx} className="mosaic-photo">
                  <div style={{ position: "relative", width: "100%", height: "160px", borderRadius: "16px", overflow: "hidden" }}>
                    <Image src={p.image} alt={p.caption} fill className="object-cover" />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: "0.8rem", marginTop: "6px", color: "var(--ink)" }}>
                    {p.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. TRUST BADGES PREVIEW                                                   */}
      {/* ========================================================================= */}
      {section === "certs" && (
        <section style={{ padding: "8px 0" }}>
          <div className="container" style={{ padding: "0" }}>
            <div className="cert-strip">
              {certs.filter((c) => c.is_active).map((c) => (
                <div key={c.id} className="cert-item">
                  <div className="cert-icon-box">
                    <CertIcon name={c.icon} />
                  </div>
                  <div className="cert-info">
                    <h3 className="cert-title">{c.title}</h3>
                    {c.subtitle && <p className="cert-sub">{c.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. BOTTOM BOOKING BANNER PREVIEW                                          */}
      {/* ========================================================================= */}
      {section === "cta" && (
        <section className="cta-banner" style={{ padding: "12px 0" }}>
          <div className="container" style={{ padding: "0" }}>
            <div className="cta-banner-card">
              <h2>
                {site.cta_heading || "Hungry?"}{" "}
                <span className="script">{site.cta_script || "Book a Table."}</span>
              </h2>
              <p className="cta-lead">{site.cta_lead}</p>
              <Link href={site.cta_button_url || "/booking"} className="btn btn-primary" style={{ marginTop: "12px" }}>
                {site.cta_button_label || "Book a Table"} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. FOOTER TAGLINE PREVIEW                                                 */}
      {/* ========================================================================= */}
      {section === "footer" && (
        <div style={{ padding: "12px 0" }}>
          <div className="container" style={{ background: "var(--deep)", color: "white", padding: "16px 20px", borderRadius: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.82rem", opacity: 0.8 }}>© 2026 The Pancake Club. All rights reserved.</span>
            <span style={{ fontSize: "0.82rem", color: "var(--yellow)", fontWeight: 700, background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "999px" }}>
              {site.footer_tagline || "Fluffy stacks · real maple · est. 1999"}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MENU HEADER & 3-STEP PICKUP PREVIEW                                    */}
      {/* ========================================================================= */}
      {section === "menu" && (
        <div style={{ padding: "12px 0" }}>
          <div className="container" style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "var(--ink)" }}>
              {site.menu_hero_heading || "Stacks On"}{" "}
              <span className="script" style={{ color: "var(--berry)" }}>
                {site.menu_hero_script || "Stacks."}
              </span>
            </h1>
            <p style={{ color: "var(--muted)", maxWidth: "500px", margin: "6px auto 0", fontSize: "0.9rem" }}>
              {site.menu_hero_lead}
            </p>
          </div>

          <div className="container">
            <div className="pickup-steps-grid">
              {steps.map((st, i) => (
                <div key={st.id} className="pickup-step-card">
                  <span className="pickup-step-num">0{i + 1}</span>
                  <h3 className="pickup-step-title">{st.title}</h3>
                  <p className="pickup-step-desc">{st.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. GALLERY & BOOKING HEADER PREVIEWS                                      */}
      {/* ========================================================================= */}
      {section === "gallery" && (
        <div className="container" style={{ textAlign: "center", padding: "20px 0" }}>
          <span className="script" style={{ color: "var(--berry)", fontSize: "1.6rem" }}>
            {site.gallery_hero_kicker || "Feast Your Eyes"}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: "var(--ink)" }}>
            {site.gallery_hero_heading || "The"}{" "}
            <span className="script" style={{ color: "var(--berry)" }}>
              {site.gallery_hero_script || "Gallery."}
            </span>
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "500px", margin: "6px auto 0", fontSize: "0.9rem" }}>
            {site.gallery_hero_lead}
          </p>
        </div>
      )}

      {section === "booking" && (
        <div className="container" style={{ textAlign: "center", padding: "20px 0" }}>
          <span className="script" style={{ color: "var(--berry)", fontSize: "1.6rem" }}>
            {site.booking_hero_kicker || "Reserve Online"}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: "var(--ink)" }}>
            {site.booking_hero_heading || "Book a"}{" "}
            <span className="script" style={{ color: "var(--berry)" }}>
              {site.booking_hero_script || "Table."}
            </span>
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "500px", margin: "6px auto 0", fontSize: "0.9rem" }}>
            {site.booking_hero_lead}
          </p>
        </div>
      )}
    </div>
  );
}
