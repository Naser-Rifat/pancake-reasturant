import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Marquee from "@/components/Marquee";
import DishGallery from "@/components/DishGallery";
import QtyAdd from "@/components/QtyAdd";
import { TAG_LABEL, getMenuWithStatus, getReviews, getSite, lines, money } from "@/lib/api";
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
    title: item.name,
    description: `${item.description} $${parseFloat(item.price)} — order pickup or book a table in Sydney.`,
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

  // a lone same-tag dish left a three-column row with two empty slots, so the
  // row is topped up from the rest of the menu rather than shown half empty
  const sameTag = items.filter((i) => i.tag === item.tag && i.slug !== item.slug);
  const otherTags = items.filter((i) => i.tag !== item.tag && i.slug !== item.slug);
  const related = [...sameTag, ...otherTags].slice(0, 3);
  const relatedAllSameTag = related.length > 0 && related.every((i) => i.tag === item.tag);
  const price = parseFloat(item.price);
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

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

  return (
    <main className="dish-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <div className="container">
        <nav className="dish-crumb" aria-label="Breadcrumb">
          <Link href="/menu">← Back to the menu</Link>
        </nav>

        {/* framed photo hero — the reference's deep frame, on the dish page */}
        <div className="hf">
          <div className="hf-photo dish">
            {/* a dish with neither a photo nor a cutout rendered src="", which makes
                the browser re-request the page as an image */}
            {(item.photo || item.image) && (
            <Image
              src={item.photo || item.image}
              alt={`${item.name} pancakes`}
              fill
              priority
              sizes="(min-width: 1024px) 1180px, 100vw"
              className={item.photo ? undefined : "as-cutout"}
            />
            )}
            {/* price tag, not a second add button: one canonical add control
                lives with the quantity stepper below */}
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

        {/* product block — copy left, cutout + polaroids right */}
        <div className="dprod">
          <div className="dprod-copy">
            <p className="kicker">{TAG_LABEL[item.tag]}</p>
            <h1>{item.name}</h1>
            {avgRating != null && (
              <p className="dish-stars">
                <span className="stars" aria-hidden="true">
                  {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                </span>{" "}
                {/* these are the restaurant's reviews, not this dish's — every dish
                    would otherwise claim the same score as its own */}
                {avgRating} for The Pancake Club ·{" "}
                <Link href="/#reviews">
                  {reviews.length} guest review{reviews.length === 1 ? "" : "s"}
                </Link>
              </p>
            )}
            <p className="dish-desc">{item.description}</p>
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
          <div className="dprod-art">
            <DishGallery
              name={item.name}
              images={[
                { id: "cutout", src: item.image, alt: `${item.name} pancakes`, cutout: true },
                ...item.photos.map((p) => ({ id: String(p.id), src: p.image, alt: p.alt })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* mid-page ticker, then the statement band — the reference's rhythm */}
      <Marquee words={lines(site.marquee_words)} />
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

      {related.length > 0 && (
        <div className="container">
          <section className="dish-related">
            <h2 className="title inline">
              {relatedAllSameTag ? (
                <>More <span className="accent">{TAG_LABEL[item.tag]}</span></>
              ) : (
                <>You might also <span className="accent">like</span></>
              )}
            </h2>
            <div className="fav-grid">
              {related.map((m) => (
                <Link href={`/menu/${m.slug}`} className="fav-card" key={m.slug}>
                  <span className={`ph${m.photo ? " framed" : ""}`}>
                    {(m.photo || m.image) && (
                      <Image src={m.photo || m.image} alt={m.name} fill sizes="(min-width: 1024px) 30vw, 88vw" />
                    )}
                  </span>
                  <span className="nm">{m.name}</span>
                  <span className="pr">{money(m.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
