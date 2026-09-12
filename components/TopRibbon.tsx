"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ExternalLink } from "lucide-react";

function FacebookIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function TopRibbon({
  address = "18 Pakington Street, Geelong West",
  facebookUrl,
  instagramUrl,
  uberEatsUrl,
}: {
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  uberEatsUrl?: string;
}) {
  const pathname = usePathname();

  // Hide on standalone preview route
  if (pathname === "/preview" || pathname?.startsWith("/preview")) {
    return null;
  }

  // Shorten address for compact displays
  const cleanAddress = address.replace(/,\s*Australia$/i, "").trim();

  return (
    <aside className="top-ribbon" aria-label="Store Information and Online Ordering">
      <div className="container top-ribbon-inner">
        {/* Left: Store Location & Operating Note */}
        <div className="top-ribbon-left">
          <Link href="/#contact" className="top-ribbon-loc">
            <MapPin size={13} className="top-ribbon-pin" aria-hidden="true" />
            <span className="top-ribbon-addr-full">{cleanAddress}</span>
            <span className="top-ribbon-addr-short">Geelong West</span>
            <span className="top-ribbon-dot" aria-hidden="true">·</span>
            <span className="top-ribbon-hours">Open Daily 11am – 9pm</span>
          </Link>
        </div>

        {/* Right: Social Channels & Uber Eats Delivery CTA */}
        <div className="top-ribbon-right">
          {/* Social Icons */}
          <div className="top-ribbon-socials" role="navigation" aria-label="Social Media Links">
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="top-ribbon-icon-btn top-ribbon-fb"
                aria-label="Follow The Pancake Club on Facebook"
                title="Facebook"
              >
                <FacebookIcon size={13} />
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="top-ribbon-icon-btn top-ribbon-ig"
                aria-label="Follow The Pancake Club on Instagram"
                title="Instagram"
              >
                <InstagramIcon size={13} />
              </a>
            )}
          </div>

          {/* Uber Eats Delivery Pill */}
          {uberEatsUrl && (
            <a
              href={uberEatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="top-ribbon-uber-btn"
              aria-label="Order takeaway delivery on Uber Eats"
            >
              <span className="uber-dot" aria-hidden="true" />
              <span className="uber-icon" aria-hidden="true">🛵</span>
              <span className="uber-label">Uber Eats</span>
              <ExternalLink size={10} className="uber-arrow" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
