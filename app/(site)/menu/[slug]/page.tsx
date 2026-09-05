import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles, Star } from "lucide-react";
import Marquee from "@/components/Marquee";
import DishGallery from "@/components/DishGallery";
import QtyAdd from "@/components/QtyAdd";
import { TAG_LABEL, getMenuWithStatus, getReviews, getSite, lines, money, type ApiMenuItem } from "@/lib/api";
import { jsonLd } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const TAG_ICONS: Record<ApiMenuItem["tag"], string> = {
  sweet: "🍯",
  savoury: "🥓",
  choc: "🍫",
};

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
  const sameTag = items.filter((i) => i.tag === item.tag && i.slug !== item.slug);
  const otherTags = items.filter((i) => i.tag !== item.tag && i.slug !== item.slug);
  const related = [...sameTag, ...otherTags].slice(0, 3);
  const relatedAllSameTag = related.length > 0 && related.every((i) => i.tag === item.tag);

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
        {/* Breadcrumb Navigation */}
        <nav className="dish-crumb" aria-label="Breadcrumb">
          <Link href="/menu">← Back to the menu</Link>
          <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>/</span>
          <span style={{ textTransform: "capitalize", color: "var(--deep)", fontWeight: 700 }}>
            {TAG_ICONS[item.tag]} {TAG_LABEL[item.tag]}
          </span>
        </nav>

        {/* 1. Large Hero Photo Deep Frame */}
        <div className="hf" style={{ border: "2px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 40px rgba(33,26,20,0.14)" }}>
          <div className="hf-photo dish">
            {heroImage && (
              <Image
                src={heroImage}
                alt={`${item.name} pancakes`}
                fill
                priority
                sizes="(min-width: 1024px) 1180px, 100vw"
                className={item.photo ? undefined : "as-cutout"}
              />
            )}
            {/* Spinning Rotating Circular Price Badge */}
            <span className="price-spin" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="dishring" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
                </defs>
                <text><textPath href="#dishring">fresh daily • est. 1999 •</textPath></text>
              </svg>
              <span className="num">${price}</span>
            </span>
          </div>
        </div>

        {/* 2. Product Details Block: Copy on Left, Multiple Image Slider Rail on Right */}
        <div className="dprod">
          {/* Left Column: Copy & Order Controls */}
          <div className="dprod-copy">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "0.4rem" }}>
              <span className={`fav-tag-badge tag-${item.tag}`} style={{ fontSize: "0.75rem", padding: "5px 12px" }}>
                <span>{TAG_ICONS[item.tag]}</span>
                <span>{TAG_LABEL[item.tag]}</span>
              </span>
              {item.heat === "medium" && (
                <span style={{ background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800 }}>
                  🌶️ Medium
                </span>
              )}
              {item.heat === "hot" && (
                <span style={{ background: "#ffe4e6", color: "#9f1239", border: "1px solid #fecdd3", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800 }}>
                  🔥 Spicy
                </span>
              )}
            </div>

            <h1>{item.name}</h1>

            {avgRating != null && (
              <p className="dish-stars">
                <span className="stars" aria-hidden="true" style={{ color: "var(--yellow-deep, #f59e0b)" }}>
                  {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                </span>{" "}
                {avgRating} for The Pancake Club ·{" "}
                <Link href="/#reviews">
                  {reviews.length} guest review{reviews.length === 1 ? "" : "s"}
                </Link>
              </p>
            )}

            <p className="dish-desc">{item.description}</p>

            {/* Nutrition & Timing Chips */}
            <div className="chips">
              {item.kcal != null && <span className="chip">🔥 {item.kcal} kcal</span>}
              {item.protein_g != null && <span className="chip">💪 {item.protein_g}g protein</span>}
              {item.prep_time && <span className="chip">⏱ {item.prep_time}</span>}
            </div>

            <p className="dish-price">
              {money(item.price)} <span>per stack</span>
            </p>

            {site.online_ordering_enabled ? (
              <QtyAdd slug={item.slug} />
            ) : (
              <div className="dish-paused-cta" style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", margin: "1rem 0" }}>
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

          {/* Right Column: Multiple Images Slider Rail / Gallery */}
          <div className="dprod-art">
            <DishGallery
              name={item.name}
              images={galleryImages.length > 0 ? galleryImages : [{ id: "main", src: heroImage, alt: item.name }]}
            />
          </div>
        </div>
      </div>

      {/* 3. Mid-page Running Marquee Ticker */}
      <Marquee words={lines(site.marquee_words)} />

      {/* 4. Retro Statement Band with Stickers */}
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
                <>More <span className="accent">{TAG_LABEL[item.tag]}</span></>
              ) : (
                <>You might also <span className="accent">like</span></>
              )}
            </h2>

            {/* Boutique Diner Menu Cards Grid */}
            <div className="fav-grid">
              {related.map((m) => {
                const imgSrc = m.photo || m.image;
                const stageClass = `stage-${m.tag || "sweet"}`;

                return (
                  <Link href={`/menu/${m.slug}`} className="fav-diner-card" key={m.slug}>
                    {/* Top Bar: Tag Badge + Price Pill */}
                    <div className="fav-card-top">
                      <span className={`fav-tag-badge tag-${m.tag}`}>
                        <span>{TAG_ICONS[m.tag] || "🥞"}</span>
                        <span>{TAG_LABEL[m.tag] || "Pancake"}</span>
                      </span>
                      <span className="fav-price-pill">{money(m.price)}</span>
                    </div>

                    {/* Dish Photo Stage with Glow */}
                    <div className={`fav-photo-stage ${stageClass}`}>
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={m.name}
                          width={400}
                          height={300}
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 85vw"
                          className="fav-dish-img"
                        />
                      ) : (
                        <div className="fav-dish-placeholder">
                          <span className="placeholder-icon">🥞</span>
                          <span className="placeholder-text">Chef&apos;s Special</span>
                        </div>
                      )}

                      {/* Special Marker */}
                      {parseFloat(String(m.price)) > 18 && (
                        <span className="fav-crowd-marker">
                          <Sparkles size={11} className="inline mr-1" />
                          Special
                        </span>
                      )}
                    </div>

                    {/* Bottom Body Content */}
                    <div className="fav-card-body">
                      <h3 className="fav-card-name">{m.name}</h3>
                      <p className="fav-card-desc">
                        {m.description || "Freshly griddled fluffy pancake stack served with whipped butter and maple syrup."}
                      </p>

                      {/* Card Action Link */}
                      <div className="fav-card-action">
                        <span>View Details</span>
                        <ArrowRight size={14} className="fav-arrow" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
