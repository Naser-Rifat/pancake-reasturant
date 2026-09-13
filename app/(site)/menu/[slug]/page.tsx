import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import DishGallery from "@/components/DishGallery";
import DishCard, { TAG_ICONS } from "@/components/DishCard";
import QtyAdd from "@/components/QtyAdd";
import DishMenuButton from "@/components/DishMenuButton";
import CartButton from "@/components/CartButton";
import { TAG_LABEL, getMenuWithStatus, getReviews, getSite, money, type ApiMenuItem } from "@/lib/api";
import { jsonLd } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { items } = await getMenuWithStatus();
  const item = items.find((i) => i.slug === slug);
  if (!item) return { title: "Menu" };
  const image = item.photo || item.image;
  return {
    title: `${item.name} — The Pancake Club`,
    description: `${item.description} $${parseFloat(item.price)} — freshly griddled fluffy pancakes. Order takeaway or book a table.`,
    alternates: { canonical: `/menu/${item.slug}` },
    openGraph: {
      title: `${item.name} | The Pancake Club`,
      description: item.description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function DishPage({ params }: Props) {
  const { slug } = await params;
  const [{ items }, site, reviews] = await Promise.all([getMenuWithStatus(), getSite(), getReviews()]);
  const item = items.find((i) => i.slug === slug);
  if (!item) notFound();

  // Related dishes for the bottom row
  const catIcon = item.category_icon || item.category?.icon || TAG_ICONS[item.tag] || "🥞";
  const catLabel = item.category_name || item.category?.name || TAG_LABEL[item.tag] || item.tag;
  const itemCatKey = item.category_slug || item.tag;
  const sameTag = items.filter((i) => (i.category_slug || i.tag) === itemCatKey && i.slug !== item.slug);
  const otherTags = items.filter((i) => (i.category_slug || i.tag) !== itemCatKey && i.slug !== item.slug);
  const related = [...sameTag, ...otherTags].slice(0, 3);
  const relatedAllSameTag = related.length > 0 && related.every((i) => (i.category_slug || i.tag) === itemCatKey);

  const price = parseFloat(item.price);
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 4.9;

  const schema = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    description: item.description,
    ...(item.photo || item.image ? { image: item.photo || item.image } : {}),
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "AUD",
      availability: "https://schema.org/InStock",
    },
    ...(item.kcal != null && {
      nutrition: { "@type": "NutritionInformation", calories: `${item.kcal} calories` },
    }),
  };

  // Build the complete multiple images list for the gallery slider rail
  const heroImage = item.photo || item.image;
  const galleryImages = [
    ...(item.image ? [{ id: "cutout", src: item.image, alt: `${item.name} cutout`, cutout: true }] : []),
    ...(item.photo ? [{ id: "photo-main", src: item.photo, alt: `${item.name} real photo` }] : []),
    ...(item.photos ?? []).map((p) => ({ id: String(p.id), src: p.image, alt: p.alt || `${item.name} angle` })),
  ];

  return (
    <main className="dish-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <div className="container">
        {/* Breadcrumb Navigation / Mobile Top App Bar */}
        <nav className="dish-crumb" aria-label="Breadcrumb">
          <Link href="/menu" className="dish-back">
            <span className="dish-back-arrow" aria-hidden="true">←</span>
            <span className="dish-back-label">Back to the menu</span>
          </Link>
          <span className="dish-crumb-sep" style={{ margin: "0 0.55rem", opacity: 0.45 }}>/</span>
          <span className="dish-crumb-tag">
            {catIcon} {catLabel}
          </span>
          <span className="dish-topbar-title">Pancake Details</span>
          {/* right-hand pair: cart button, then quick menu */}
          <span className="dish-topbar-actions">
            <CartButton live={site.online_ordering_enabled} className="dish-topbar-cart" />
            <DishMenuButton />
          </span>
        </nav>

        {/* Product Details: Left Gallery, Right Details (on mobile stacked food-first) */}
        <div className="dprod">
          {/* Visual Showcase (Hero Floating Image / Cutout with sticker stroke + Counter) */}
          <div className="dprod-art">
            <DishGallery
              name={item.name}
              images={galleryImages.length > 0 ? galleryImages : [{ id: "main", src: heroImage, alt: item.name }]}
            />
          </div>

          {/* Copy & Order Controls */}
          <div className="dprod-copy">
            {/* 3 Boutique Soft Pastel Pill Badges (matches artisan reference) */}
            <div className="dish-pill-tags">
              <span className="dish-pill-tag tag-rose">
                <span>{catIcon}</span>
                <span>{catLabel}</span>
              </span>
              <span className="dish-pill-tag tag-peach">
                <span>{item.is_featured ? "✨ House Favourite" : "🔥 Freshly Griddled"}</span>
              </span>
              <span className="dish-pill-tag tag-sky">
                <span>{item.tag === "savory" ? "🍳 Farm Fresh Eggs" : "🍯 Pure Maple Syrup"}</span>
              </span>
            </div>

            <h1 className="dish-title">{item.name}</h1>

            {avgRating != null && (
              <p className="dish-stars">
                <span className="stars" aria-hidden="true" style={{ color: "var(--yellow-deep, #f59e0b)" }}>
                  {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                </span>{" "}
                <span className="rating-score">{avgRating}</span> ·{" "}
                <Link href="/#reviews">
                  {reviews.length} guest review{reviews.length === 1 ? "" : "s"}
                </Link>
              </p>
            )}

            <p className="dish-desc">{item.description}</p>

            {/* 2 Boutique Specification Cards (commented out per user request; uncomment to re-enable) */}
            {/*
            <div className="dish-spec-cards">
              <div className="dish-spec-card">
                <span className="spec-label">Kitchen Prep</span>
                <span className="spec-value">{item.prep_time || "10 - 12 Mins"}</span>
              </div>
              <div className="dish-spec-card">
                <span className="spec-label">Stack Size</span>
                <span className="spec-value">
                  {item.tag === "beverage" ? "1 Fresh Brew" : item.tag === "sides" ? "Generous Portion" : "3 Fluffy Pancakes"}
                </span>
              </div>
            </div>
            */}

            {/* Desktop Inline Buy Section (hidden on mobile where sticky bottom dock is active) */}
            <div className="dish-desktop-buy">
              {site.online_ordering_enabled ? (
                <div className="dish-buy-inline">
                  <p className="dish-price">
                    {money(item.price)} <span>per stack</span>
                  </p>
                  <QtyAdd slug={item.slug} name={item.name} />
                </div>
              ) : (
                <div className="dish-paused-cta">
                  <Link href="/booking" className="btn btn-primary">
                    Book a Table 🥞
                  </Link>
                  {site.uber_eats_url && (
                    <a
                      href={site.uber_eats_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ background: "#06C167", color: "#fff", borderColor: "#06C167" }}
                    >
                      Order on Uber Eats 🛵
                    </a>
                  )}
                </div>
              )}

              <p className="dish-note">
                Pickup from {site.address.split(",")[0]} — griddled when you order, never before.{" "}
                <Link href="/booking">Or book a table →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Dock for Mobile & Tablet (matches Image 2 reference) */}
      <div className="dish-sticky-dock">
        <div className="dock-price-wrap">
          <span className="dock-price">${price % 1 === 0 ? price : price.toFixed(2)}</span>
          <span className="dock-price-sub">per stack</span>
        </div>
        <div className="dock-action-wrap">
          {site.online_ordering_enabled ? (
            <QtyAdd slug={item.slug} name={item.name} />
          ) : (
            <Link href="/booking" className="btn btn-primary btn-dock-add">
              Book a Table 🥞
            </Link>
          )}
        </div>
      </div>

      {/* 4. Retro Statement Band with Stickers (displayed on desktop, hidden on mobile via CSS) */}
      <section className="statement">
        <div className="container statement-in">
          <span className="st-pill" style={{ top: "14%", left: "6%", transform: "rotate(-8deg)" }}>Pancakes</span>
          <span className="st-pill" style={{ top: "8%", right: "12%", transform: "rotate(6deg)" }}>No pre-mix</span>
          <span className="st-pill" style={{ bottom: "16%", left: "14%", transform: "rotate(5deg)" }}>Real maple</span>
          <span className="st-pill" style={{ bottom: "10%", right: "7%", transform: "rotate(-6deg)" }}>Good vibes</span>
          <p className="st-text">
            Some things take forever — breakfast shouldn&apos;t be one of them.
          </p>
        </div>
      </section>

      {/* 5. Recommended / Related Dishes with Boutique Diner Cards */}
      {related.length > 0 && (
        <div className="container" style={{ paddingBottom: "4rem", paddingTop: "2rem" }}>
          <section className="dish-related">
            <h2 className="title inline">
              {relatedAllSameTag ? (
                <>More <span className="accent">{catLabel}</span></>
              ) : (
                <>You might also <span className="accent">like</span></>
              )}
            </h2>

            {/* Boutique Diner Menu Cards Grid */}
            <div className="dish-related-grid">
              {related.map((m) => (
                <DishCard item={m} variant="tile" key={m.slug} />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
