"use client";

// Hero: headline with an inline dish chip, CTAs, and a thumbnail switcher that
// swaps the photo on the right. Thumbs sit with the buttons (reference layout)
// so they're part of the reading path, not decoration on the photo.

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import type { ApiMenuItem } from "@/lib/api";
import { ChevronRight } from "lucide-react";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#contact", label: "Contact" },
];

type Cta = { href: string; label: string; variant: "primary" | "ghost" };

export default function HeroShowcase({
  heading,
  script,
  lead,
  ctas,
  heroImage,
  heroCutout,
  dishes,
}: {
  heading: string;
  script: string;
  lead: string;
  ctas: Cta[];
  heroImage: string;
  /** the round cutout sitting inside the headline; set in Content → Hero */
  heroCutout: string;
  dishes: ApiMenuItem[];
}) {
  const cheapest = dishes.length
    ? Math.min(...dishes.map((d) => parseFloat(d.price)))
    : null;
  const slides = [
    {
      src: heroImage,
      alt: "Signature dish at The Pancake Club",
      // the reference always states a price; the hero shot quotes the entry point
      price: cheapest ? `From $${cheapest}` : "",
    },
    ...dishes.slice(0, 2).map((d) => ({
      src: d.photo || d.image,
      alt: `${d.name} pancakes`,
      price: `$${parseFloat(d.price)}`,
    })),
  ].filter((s) => s.src);

  const [active, setActive] = useState(0);
  const current = slides[active] ?? slides[0];
  // the admin picks this; fall back to the first featured dish that has one so
  // the headline is never left with a gap
  const chip = heroCutout || dishes.find((d) => d.image)?.image;

  const headingWords = heading ? heading.trim().split(/\s+/) : ["Stack", "Into"];

  return (
    <>
      {current && (
        <div className="hero-bg">
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="100vw"
          />
          <span className="hero-scrim" aria-hidden="true" />
        </div>
      )}

      {/* Full-width hero top navigation bar spanning the hero container */}
      <nav className="hero-nav" aria-label="Main">
        <Link href="/" className="hero-logo" aria-label="The Pancake Club — home">
          <span className="hero-logo-disc" aria-hidden="true"><LogoMark size={19} /></span>
          <span className="hero-logo-name">The Pancake Club</span>
        </Link>
        <ul className="hero-nav-links">
          {NAV.map((l) => (
            <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
          ))}
        </ul>
        <div className="hero-topbar">
          <Link href="/menu" className="hero-find">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            Find a stack
          </Link>
          <Link href="/menu" className="hero-order">Order Now<ChevronRight className="arrow-icon" size={14} strokeWidth={2.75} /></Link>
        </div>
      </nav>

      <div className="hero-card-left">
        <h1>
          {headingWords.length >= 2 ? (
            <>
              <span className="head-line">{headingWords[0]}</span>
              <span className="head-line">
                {headingWords.slice(1).join(" ")}
                {chip && (
                  <span className="head-chip" aria-hidden="true">
                    <Image src={chip} alt="" width={120} height={120} sizes="64px" />
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              {heading}
              {chip && (
                <span className="head-chip" aria-hidden="true">
                  <Image src={chip} alt="" width={120} height={120} sizes="64px" />
                </span>
              )}
            </>
          )}
          <span className="script">{script}</span>
        </h1>
        <p className="lead">{lead}</p>

        <div className="hero-actions">
          {ctas.map((c) => (
            <Link key={c.href} href={c.href} className={`btn btn-${c.variant}`}>
              {c.label}
              {c.variant === "primary" && <ChevronRight className="arrow-icon" size={18} strokeWidth={2.75} />}
            </Link>
          ))}

          {slides.length > 1 && (
            <div className="hero-thumbs" role="tablist" aria-label="Preview a dish">
              {slides.map((s, i) => (
                <button
                  key={s.src}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={s.alt}
                  className={i === active ? "on" : ""}
                  onClick={() => setActive(i)}
                >
                  <Image src={s.src} alt="" width={120} height={120} sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hero-card-right">
        {current?.price && <span className="hero-price">{current.price}</span>}
      </div>
    </>
  );
}
