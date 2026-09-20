"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, ChevronRight, Ticket } from "lucide-react";
import CertIcon from "@/components/CertIcon";
import HeroShowcase from "@/components/HeroShowcase";
import MenuClient from "@/components/MenuClient";
import { countdownBadge, type ApiMenuItem } from "@/lib/api";
import clubStyles from "@/app/(site)/join-our-club/club.module.css";
import {
  type AdminSiteSettings,
  type AdminAnnouncement,
  type AdminCategory,
  type AdminCertification,
  type AdminGalleryPhoto,
  type AdminMenuItem,
} from "@/lib/admin-api";
import {
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_CERTS,
  DEFAULT_DEAL_PHOTO,
  DEFAULT_DISHES,
  DEFAULT_PHOTOS,
  DEFAULT_SITE,
} from "./_lib";

/** Honest banner over the deal preview: the design below is shown as you're
 *  building it, but visitors only see it while the deal is actually live. */
function DealStatusNote({
  status,
  announcement,
}: {
  status: "live" | "scheduled" | "expired" | "hidden";
  announcement: AdminAnnouncement | null;
}) {
  if (status === "live") return null;
  const nice = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleString("en-AU", {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";
  const config =
    status === "scheduled"
      ? {
          icon: "⏳",
          badge: "SCHEDULED",
          text: `Visitors will see this from ${nice(announcement?.starts_at)}`,
          style: {
            background: "rgba(254, 243, 199, 0.92)",
            border: "1px solid #fcd34d",
            color: "#78350f",
          },
        }
      : status === "expired"
      ? {
          icon: "🕰️",
          badge: "ENDED",
          text: `Ended ${nice(announcement?.ends_at)} — hidden from visitors`,
          style: {
            background: "rgba(244, 244, 245, 0.95)",
            border: "1px solid #d4d4d8",
            color: "#3f3f46",
          },
        }
      : {
          icon: "🙈",
          badge: "DRAFT / HIDDEN",
          text: "“Show on Website” is OFF — visitors don't see this deal",
          style: {
            background: "rgba(255, 251, 235, 0.95)",
            border: "1px solid #fde68a",
            color: "#92400e",
          },
        };

  return (
    <div
      style={{
        margin: "0 0 10px",
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 600,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        ...config.style,
      }}
    >
      <span>{config.icon}</span>
      <span
        style={{
          textTransform: "uppercase",
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.05em",
          background: "rgba(0,0,0,0.06)",
          padding: "1px 6px",
          borderRadius: "4px",
        }}
      >
        {config.badge}
      </span>
      <span>{config.text}</span>
    </div>
  );
}

export default function PreviewPage() {
  const [section, setSection] = useState<string>("hero");
  // stay invisible until the studio's first sync lands — otherwise the
  // built-in placeholder data flashes before the real content arrives
  const [synced, setSynced] = useState(false);
  const [site, setSite] = useState<AdminSiteSettings>(DEFAULT_SITE);

  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(DEFAULT_ANNOUNCEMENT);
  // what the public site would do with the edited deal right now
  const [dealStatus, setDealStatus] = useState<"live" | "scheduled" | "expired" | "hidden">("live");

  // Custom customizable section titles from admin
  const [section1Kicker, setSection1Kicker] = useState<string>("✨ TODAY'S FEATURED SPECIAL");
  const [section2Kicker, setSection2Kicker] = useState<string>("On Right Now");
  const [section2Title, setSection2Title] = useState<string>("This Week's Offers");
  const [customBadge, setCustomBadge] = useState<string>("");

  const [certs, setCerts] = useState<AdminCertification[]>(DEFAULT_CERTS);
  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>(DEFAULT_PHOTOS);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [campaigns, setCampaigns] = useState<AdminAnnouncement[]>([]);
  const [dishes, setDishes] = useState<AdminMenuItem[]>(DEFAULT_DISHES);

  const featuredDishes = dishes.filter((dish) => dish.is_featured);
  const previewMenuItems: ApiMenuItem[] = dishes.map((dish) => ({
    ...dish,
    category: null,
    photos: [],
  }));

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== "PANCAKE_PREVIEW_SYNC") return;
      const {
        section: s,
        site: nextSite,
        announcement: nextAnn,
        dealStatus: nextDealStatus,
        section1Kicker: nextK1,
        section2Kicker: nextK2,
        section2Title: nextT2,
        customBadge: nextBadge,
        certs: nextCerts,
        photos: nextPhotos,
        categories: nextCategories,
        campaigns: nextCampaigns,
        dishes: nextDishes,
      } = e.data;
      if (s) setSection(s);
      if (nextSite) setSite(nextSite);
      if (nextAnn !== undefined) setAnnouncement(nextAnn);
      if (nextDealStatus !== undefined) setDealStatus(nextDealStatus);
      if (nextK1 !== undefined) setSection1Kicker(nextK1);
      if (nextK2 !== undefined) setSection2Kicker(nextK2);
      if (nextT2 !== undefined) setSection2Title(nextT2);
      if (nextBadge !== undefined) setCustomBadge(nextBadge);
      if (nextCerts) setCerts(nextCerts);
      if (nextPhotos) setPhotos(nextPhotos);
      if (Array.isArray(nextCategories)) setCategories(nextCategories);
      if (Array.isArray(nextCampaigns)) setCampaigns(nextCampaigns);
      if (Array.isArray(nextDishes)) setDishes(nextDishes);
      setSynced(true);
    };

    window.addEventListener("message", handler);
    window.parent?.postMessage({ type: "PANCAKE_PREVIEW_READY" }, "*");

    // keep the studio's iframe exactly content-sized — report every height change.
    // Measure the container rect, not scrollHeight: scrollHeight never drops
    // below the iframe's own viewport, which would lock the height ratcheted up.
    const sendSize = () => {
      const el = document.querySelector(".preview-container");
      if (!el) return;
      const isHero = el.classList.contains("preview-container-hero");
      const width = document.documentElement.clientWidth;
      // A viewport-height hero cannot choose its iframe's height from its own
      // measured height (that creates a circular dependency). Give the studio
      // a stable, device-like viewport derived from width instead.
      const height = isHero
        ? width <= 1023
          ? Math.min(820, Math.max(640, Math.round(width * 1.75)))
          : Math.min(760, Math.max(520, Math.round(width * 0.5625)))
        : Math.ceil(el.getBoundingClientRect().bottom);
      window.parent?.postMessage(
        { type: "PANCAKE_PREVIEW_SIZE", height },
        "*",
      );
    };
    const ro = new ResizeObserver(sendSize);
    const container = document.querySelector(".preview-container");
    if (container) ro.observe(container);
    ro.observe(document.body);
    sendSize();

    const params = new URLSearchParams(window.location.search);
    const qSection = params.get("section");
    if (qSection) setSection(qSection);

    return () => {
      window.removeEventListener("message", handler);
      ro.disconnect();
    };
  }, []);

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
    <div
      className={`preview-container bg-[var(--cream)] text-[var(--ink)] antialiased ${
        section === "hero" ? "preview-container-hero" : ""
      }`}
      style={{ visibility: synced ? "visible" : "hidden" }}
    >
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
        footer:not(.preview-keep),
        .site-footer:not(.preview-keep),
        .whatsapp-float,
        .wa-float {
          display: none !important;
        }

        .preview-container {
          overflow: hidden !important;
          padding: 8px !important;
        }

        /* The shared storefront hero is exactly 100vh/100svh. Padding this
           iframe root made its measured content 16px taller than the iframe,
           so the parent enlarged it by 16px on every ResizeObserver pass. */
        .preview-container.preview-container-hero {
          padding: 0 !important;
        }

        /* the site's fixed page-frame border is chrome, not content — hide it here */
        body::after {
          display: none !important;
        }

        .preview-container .promo-band {
          margin: 0.25rem auto !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 30px rgba(33, 26, 20, 0.18) !important;
        }

        @media (min-width: 640px) {
          .preview-container .promo-band {
            padding: 1.5rem 2.2rem !important;
          }
        }

        .preview-container .promo-head {
          font-size: clamp(1.35rem, 2.2vw, 1.9rem) !important;
          line-height: 1.1 !important;
          margin: 0.35rem 0 !important;
        }

        .preview-container .camp-slide {
          margin: 0.25rem auto !important;
        }

      `}</style>

      {/* The preview deliberately renders the storefront component itself. Keeping
          only one hero implementation prevents the studio and website drifting. */}
      {section === "hero" && (
        <section className="hero">
          <div className="container hero-cards">
            <HeroShowcase
              heading={site.hero_heading}
              script={site.hero_script}
              lead={site.hero_lead}
              ctas={[
                { href: "/booking", label: "BOOK A TABLE", variant: "primary" },
                { href: "/menu", label: "EXPLORE MENU", variant: "ghost" },
              ]}
              heroImage={site.hero_image}
              heroCutout={site.hero_cutout}
              dishes={dishes.filter((dish) => dish.is_featured)}
            />
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2A. CAMPAIGN FORMAT 1: TOP RETRO DINER PROMO BAND                         */}
      {/* ========================================================================= */}
      {section === "deals" && (
        <section className="promo" style={{ padding: "0" }}>
          <div className="container" style={{ padding: "0" }}>
            <DealStatusNote status={dealStatus} announcement={announcement} />
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
                {(() => {
                  const badge = countdownBadge(announcement?.ends_at || null);
                  const bigText = badge.big === "ON" ? "DEAL" : badge.big;
                  const smallText = badge.small === "now" ? "TODAY" : badge.small;
                  return (
                    <div className="starburst-center">
                      <span className="starburst-icon">🔥</span>
                      <b className="starburst-big">{bigText}</b>
                      <span className="starburst-small">{smallText}</span>
                    </div>
                  );
                })()}
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

              {/* Right: 2 Voucher Ticket Cards — same picking rules as the live site */}
              <div className="promo-cards">
                {(() => {
                  const pick = (slug?: string) =>
                    slug ? dishes.find((m) => m.slug === slug && (m.photo || m.image)) : undefined;
                  const card1D = pick(announcement?.card1_dish);
                  const card2D =
                    pick(announcement?.card2_dish) ?? featuredDishes.find((m) => m.photo || m.image);
                  const cards = [
                    card1D
                      ? { img: card1D.photo || card1D.image, label: card1D.name, tag: "✨ Special" }
                      : { img: dealPhotoSrc, label: "The Offer", tag: `✨ ${displayBadgeTag}` },
                    ...(card2D
                      ? [{ img: card2D.photo || card2D.image, label: card2D.name, tag: "🥞 Popular" }]
                      : []),
                  ];
                  return cards.map((c, i) => (
                    <div
                      key={c.label + i}
                      className={`promo-ticket-card ${i === 1 ? "tilt-card" : ""}`}
                    >
                      <div className="ticket-top-tag">
                        <span>{c.tag}</span>
                        <span className="ticket-open-icon">↗</span>
                      </div>
                      <div className="ticket-img-frame">
                        <Image src={c.img} alt={c.label} fill sizes="(min-width: 1024px) 220px, 45vw" className="ticket-img object-cover" />
                      </div>
                      <span className="ticket-dish-title">
                        {c.label}
                      </span>
                    </div>
                  ));
                })()}
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
            <DealStatusNote status={dealStatus} announcement={announcement} />
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
                    <Link href="/booking" className="camp-cta">
                      <span>Book a Table</span>
                      <ChevronRight size={16} strokeWidth={2.5} className="camp-btn-arrow" />
                    </Link>
                    <Link href={announcement?.link_url || "/menu"} className="camp-cta-secondary">
                      <span>{announcement?.link_text || "Explore Menu"}</span>
                    </Link>
                  </div>

                  {/* Vintage Rubber Stamp Watermark */}
                  <div className="camp-vintage-stamp" aria-hidden="true">
                    <span>FLUFFY</span>
                    <b>{displayBadgeTag.toUpperCase()}</b>
                    <small>GEELONG</small>
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
            {/* same scrapbook mosaic markup as the live homepage */}
            <div className="gallery-mosaic" style={{ marginTop: "0.5rem" }}>
              {photos.slice(0, 6).map((p, i) => {
                const tapes = ["tape-left", "tape-right", "tape-center", "tape-left", "tape-pin", "tape-right"];
                const tape = tapes[i % tapes.length];
                const stamps = ["🥞 100% Fluffy", "✨ Geelong Vibe", "☕ Fresh Brew", "🍓 Berry Sweet", "💛 Café Mood", "🍯 Golden Maple"];
                const stamp = stamps[i % stamps.length];
                const isHero = i === 0;
                return (
                  <div key={p.id || i} className={`mosaic-polaroid ${isHero ? "mosaic-hero" : ""}`}>
                    <div className={`washi-tape ${tape}`} aria-hidden="true" />
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
                      />
                    </div>
                    {isHero && p.caption && (
                      <div className="mosaic-hero-chin">
                        <p className="mosaic-hero-caption">{p.caption}</p>
                        <span className="mosaic-hero-tag">📍 Geelong, Victoria</span>
                      </div>
                    )}
                  </div>
                );
              })}
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
            {/* same badge markup as the live homepage */}
            <ul className="cert-strip" aria-label="Food standards and recognition">
              {certs.filter((c) => c.is_active).map((c) => (
                <li key={c.id} className="cert-badge quality-seal-badge">
                  <span className={`ic${c.image ? " cert-real-logo" : ""}`}>
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.title}
                        width={72}
                        height={52}
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
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. BOTTOM BOOKING BANNER PREVIEW                                          */}
      {/* ========================================================================= */}
      {section === "cta" && (
        /* same warm CTA band as the live homepage, with trimmed padding to fit the frame */
        <section className="cta diner-cta-banner" style={{ padding: "2rem 0 2.8rem" }}>
          <div className="container">
            <p className="cta-kicker">READY FOR A FEAST?</p>
            <h2>
              {site.cta_heading || "Hungry?"}{" "}
              <span className="accent">{site.cta_script || "Book a Table."}</span>
            </h2>
            <p className="cta-lead-text">{site.cta_lead}</p>
            <Link href={site.cta_button_url || "/booking"} className="btn btn-primary cta-action-btn">
              <span>🥞 {site.cta_button_label || "Book a Table Now"}</span>
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. FOOTER TAGLINE PREVIEW                                                 */}
      {/* ========================================================================= */}
      {section === "footer" && (
        /* the real footer's brand corner — the tagline lives under the cream logo */
        <footer className="site-footer preview-keep" style={{ padding: "2.2rem 0" }}>
          <div className="container">
            <div className="f-col f-col-brand">
              <Image
                src="/logo.png"
                alt="The Pancake Club"
                width={529}
                height={226}
                className="f-brand-logo"
              />
              <p className="f-brand-tag">
                {site.footer_tagline || "Fluffy stacks · made to order · Geelong West"}
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* The real public menu component keeps category order and dish boards
          identical between the storefront and this admin preview. */}
      {section === "menu" && (
        <>
          <section className="menu-hero">
            <div className="container">
              <h1>
                {site.menu_hero_heading || "Pick your"}{" "}
                <span className="accent">{site.menu_hero_script || "Favourites"}</span>
              </h1>
              <p>{site.menu_hero_lead || "Freshly made and served with love"}</p>
            </div>
          </section>
          <MenuClient
            items={previewMenuItems}
            categories={categories}
            campaigns={campaigns}
            live={site.online_ordering_enabled}
            phone={site.phone}
            pauseMessage={site.online_ordering_disabled_message}
            uberEatsUrl={site.uber_eats_url}
          />
        </>
      )}

      {/* ========================================================================= */}
      {/* 8. GALLERY & BOOKING HEADER PREVIEWS                                      */}
      {/* ========================================================================= */}
      {section === "gallery" && (
        /* same page-hero as the live /gallery page */
        <section className="page-hero gallery-hero" style={{ padding: "2rem 0" }}>
          <div className="container">
            <p className="kicker">{site.gallery_hero_kicker || "Feast Your Eyes"}</p>
            <h1>
              {site.gallery_hero_heading || "The"}{" "}
              <span className="accent">{site.gallery_hero_script || "Gallery."}</span>
            </h1>
            <p className="hero-subtext">
              {site.gallery_hero_lead || "Our food, our space, and the good times in between."}
            </p>
          </div>
        </section>
      )}

      {section === "booking" && (
        /* same page-hero as the live /booking page */
        <section className="page-hero" style={{ padding: "2rem 0" }}>
          <div className="container">
            <p className="kicker">{site.booking_hero_kicker || "Request Online — Free & Easy"}</p>
            <h1>
              {site.booking_hero_heading || "Book a"}{" "}
              <span className="accent">{site.booking_hero_script || "Table."}</span>
            </h1>
            <p>{site.booking_hero_lead || "Pick a date, pick a time — we'll have the griddle hot when you arrive."}</p>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. JOIN OUR CLUB PAGE PREVIEW                                             */}
      {/* ========================================================================= */}
      {section === "club" && (
        <div style={{ padding: "0.25rem 0 2rem", background: "linear-gradient(180deg, #faf5ee 0%, #f4ebe1 100%)" }}>
          {/* Master Hero Stage */}
          <section className={clubStyles.heroStage} style={{ paddingTop: "1.5rem", paddingBottom: "1.75rem" }}>
            <div className="container">
              <div className={clubStyles.heroBadgeWrap}>
                <span className={clubStyles.heroBadge}>
                  <span className={clubStyles.heroBadgeDot} aria-hidden="true">🥞</span>
                  <span>{site.club_hero_kicker || "The Pancake Club · Geelong West"}</span>
                </span>
              </div>
              <h1 className={clubStyles.heroHeading}>
                {site.club_hero_heading || "Good food."}{" "}
                <span className={clubStyles.heroScript}>{site.club_hero_script || "Better company."}</span>
              </h1>
              <p className={clubStyles.heroLead}>
                {site.club_hero_lead || "Fluffy homemade stacks, secret tasting invites, and a table always saved for you."}
              </p>
            </div>
          </section>

          {/* 3-Image Bento Mosaic */}
          <div className="container" style={{ maxWidth: "1000px", padding: "0 1rem" }}>
            <div className={clubStyles.imageBento}>
              {/* Slot 1: Tall Feature Image */}
              <div className={clubStyles.bentoSlotTall}>
                <div className={clubStyles.bentoImgFrame}>
                  {site.club_bento_1_img ? (
                    <Image
                      src={site.club_bento_1_img}
                      alt={site.club_bento_1_title || "Signature Stack"}
                      fill
                      sizes="(max-width: 640px) 55vw, (max-width: 1024px) 50vw, 460px"
                      priority
                      className={clubStyles.bentoImg}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fffbeb", fontSize: "2rem" }}>🥞</div>
                  )}
                </div>
                <div className={clubStyles.bentoBadge}>
                  <span>{site.club_bento_1_badge || "🥞 Fresh Off The Griddle"}</span>
                </div>
                <div className={clubStyles.bentoCaption}>
                  <span className={clubStyles.bentoCaptionTitle}>{site.club_bento_1_title || "Signature Stack"}</span>
                  <span className={clubStyles.bentoCaptionSub}>{site.club_bento_1_sub || "Warm from the griddle"}</span>
                </div>
              </div>

              {/* Slot 2: Top Right */}
              <div className={clubStyles.bentoSlotTopRight}>
                <div className={clubStyles.bentoImgFrame}>
                  {site.club_bento_2_img ? (
                    <Image
                      src={site.club_bento_2_img}
                      alt={site.club_bento_2_title || "Brunch Club"}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 320px"
                      priority
                      className={clubStyles.bentoImg}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fffbeb", fontSize: "2rem" }}>🥞</div>
                  )}
                </div>
                <div className={clubStyles.bentoBadge}>
                  <span>{site.club_bento_2_badge || "🥞 Sunday Brunch"}</span>
                </div>
                <div className={clubStyles.bentoCaption}>
                  <span className={clubStyles.bentoCaptionTitle}>{site.club_bento_2_title || "Brunch Club"}</span>
                  <span className={clubStyles.bentoCaptionSub}>{site.club_bento_2_sub || "Weekend Table"}</span>
                </div>
              </div>

              {/* Slot 3: Bottom Right */}
              <div className={clubStyles.bentoSlotBottomRight}>
                <div className={clubStyles.bentoImgFrame}>
                  {site.club_bento_3_img ? (
                    <Image
                      src={site.club_bento_3_img}
                      alt={site.club_bento_3_title || "Our Parlour"}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 320px"
                      priority
                      className={clubStyles.bentoImg}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fffbeb", fontSize: "2rem" }}>☕</div>
                  )}
                </div>
                <div className={clubStyles.bentoBadge}>
                  <span>{site.club_bento_3_badge || "☕ Geelong West"}</span>
                </div>
                <div className={clubStyles.bentoCaption}>
                  <span className={clubStyles.bentoCaptionTitle}>{site.club_bento_3_title || "Our Parlour"}</span>
                  <span className={clubStyles.bentoCaptionSub}>{site.club_bento_3_sub || "Open 7 days"}</span>
                </div>
              </div>
            </div>

            {/* Integrated Founding Member Pass Bar */}
            <div className={clubStyles.memberPassStrip}>
              <div className={clubStyles.passStripLeft}>
                <span className={clubStyles.passSealSmall}>
                  <Award size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div>
                  <strong className={clubStyles.passStripTitle}>
                    {site.club_pass_title || "FOUNDING MEMBER PASS · NO. 0824"}
                  </strong>
                  <p className={clubStyles.passStripSub}>
                    {site.club_pass_sub || "Priority Seasonal Tastings · Secret Drops · Free Forever"}
                  </p>
                </div>
              </div>
              <div className={clubStyles.passStripRight}>
                <span className={clubStyles.passStripBadge}>
                  <Ticket size={12} aria-hidden="true" /> {site.club_pass_badge || "ALL WELCOME"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
