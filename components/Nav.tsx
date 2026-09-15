"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, ExternalLink } from "lucide-react";
import CartButton from "@/components/CartButton";
import { TOGGLE_MENU_EVENT } from "@/components/BottomBar";

function FacebookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav({
  live = true,
  facebookUrl,
  instagramUrl,
  uberEatsUrl,
  whatsapp,
  address = "18 Pakington Street, Geelong West",
}: {
  live?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  uberEatsUrl?: string;
  whatsapp?: string;
  address?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [hasBottomBar, setHasBottomBar] = useState(false);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      setScrolled(y > 30);

      const hero = document.querySelector(".hero");
      if (hero) {
        setPastHero(y > 220);
        setHasBottomBar((was) => (was ? y > 20 : y > 40));
      } else {
        setPastHero(true);
        setHasBottomBar(true);
      }

      // Do not auto-hide if mobile drawer or cart drawer is open
      if (open || (typeof document !== "undefined" && document.querySelector(".cart-drawer.open"))) {
        document.body.classList.remove("chrome-hidden");
        lastY = y;
        return;
      }

      // Near the top of the viewport, chrome should always remain visible
      if (y <= 30) {
        document.body.classList.remove("chrome-hidden");
      } else if (delta > 8) {
        // Scrolling DOWN -> hide chrome for full-screen immersive reading
        document.body.classList.add("chrome-hidden");
      } else if (delta < -6) {
        // Scrolling UP -> reveal chrome immediately
        document.body.classList.remove("chrome-hidden");
      }

      // Scrolling STOPPED debounce timer (smoothly re-reveal bars after 320ms pause)
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        document.body.classList.remove("chrome-hidden");
      }, 320);

      lastY = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (stopTimer) clearTimeout(stopTimer);
      if (typeof document !== "undefined") {
        document.body.classList.remove("chrome-hidden");
      }
    };
  }, [pathname, open]);

  // Close drawer on route change
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll when mobile drawer is open to prevent background leaks
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("nav-drawer-active");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("nav-drawer-active");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("nav-drawer-active");
    };
  }, [open]);

  // The bottom bar's More tab drives this same panel
  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener(TOGGLE_MENU_EVENT, toggle);
    return () => window.removeEventListener(TOGGLE_MENU_EVENT, toggle);
  }, []);

  if (pathname === "/preview" || pathname?.startsWith("/preview")) {
    return null;
  }

  const cleanAddress = address.replace(/,\s*Australia$/i, "").trim();
  const whatsappDigits = whatsapp ? whatsapp.replace(/\D/g, "") : "";

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDrawerHomeClick = (e: React.MouseEvent) => {
    setOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header className={`nav${scrolled ? " scrolled" : ""}${pastHero ? " past-hero" : ""}`}>
        <div className="container nav-inner">
          <Link
            href="/"
            className="logo"
            aria-label="The Pancake Club — home"
            onClick={handleHomeClick}
          >
            <Image
              src="/logo.png"
              alt="The Pancake Club"
              width={132}
              height={56}
              priority
              className="nav-brand-logo"
            />
          </Link>

          {/* Desktop Inline Nav Links */}
          <ul className="nav-links nav-links-desktop">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={pathname === l.href ? "active" : undefined}
                  onClick={l.href === "/" ? handleHomeClick : undefined}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <CartButton live={live} className="nav-cart" />
            <Link href="/booking" className="btn btn-primary nav-book-btn">
              <span className="nav-btn-text">Book</span>
              <span className="nav-btn-arrow">↗</span>
            </Link>
            {!hasBottomBar && (
              <button
                className={`burger-toggle${open ? " open" : ""}`}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                {open ? (
                  <X size={20} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Full-Screen Luxury Menu Drawer */}
      <div
        className={`mobile-nav-overlay${open ? " open" : ""}`}
        aria-hidden={!open}
      >
        {/* Dimmed backdrop click target */}
        <div
          className="mobile-nav-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding luxury sheet */}
        <div
          className="mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Main Navigation"
        >
          {/* Drawer Header with Brand & Dedicated X Close Button */}
          <div className="mobile-nav-header">
            <Link
              href="/"
              className="mobile-nav-logo"
              onClick={handleDrawerHomeClick}
            >
              <Image
                src="/logo.png"
                alt="The Pancake Club"
                width={124}
                height={52}
                priority
                className="nav-brand-logo"
              />
            </Link>
            <button
              type="button"
              className="mobile-nav-close-btn"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content Body */}
          <div className="mobile-nav-content">
            {/* Primary Navigation Links */}
            <ul className="mobile-nav-links-list">
              {LINKS.map((l) => {
                const isActive = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`mobile-nav-item${isActive ? " active" : ""}`}
                      onClick={l.href === "/" ? handleDrawerHomeClick : () => setOpen(false)}
                    >
                      <span className="mobile-nav-item-label">{l.label}</span>
                      <ArrowRight size={17} className="mobile-nav-item-arrow" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/booking"
                  className="mobile-nav-item mobile-nav-item-book"
                  onClick={() => setOpen(false)}
                >
                  <span className="mobile-nav-item-label">Book a Table</span>
                  <span className="mobile-nav-book-badge">Reserve ↗</span>
                </Link>
              </li>
            </ul>

            {/* Action CTAs: Uber Eats Delivery & WhatsApp Support */}
            <div className="mobile-nav-cta-stack">
              {uberEatsUrl && (
                <a
                  href={uberEatsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-drawer-uber-pill"
                >
                  <span className="m-uber-icon" aria-hidden="true">🛵</span>
                  <span className="m-uber-text">Order on Uber Eats</span>
                  <ExternalLink size={14} className="m-uber-arrow" aria-hidden="true" />
                </a>
              )}
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi The Pancake Club! I'd like to make an enquiry.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-drawer-wa-pill"
                >
                  <span className="m-wa-icon" aria-hidden="true">💬</span>
                  <span className="m-wa-text">Chat on WhatsApp</span>
                  <ExternalLink size={14} className="m-wa-arrow" aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Social Follow Channels */}
            {(facebookUrl || instagramUrl) && (
              <div className="mobile-nav-socials-box">
                <span className="mobile-nav-socials-heading">Follow Us</span>
                <div className="mobile-nav-socials-grid">
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mobile-nav-social-btn"
                      aria-label="Follow The Pancake Club on Facebook"
                    >
                      <FacebookIcon size={15} />
                      <span>Facebook</span>
                      <span className="m-ext-arrow" aria-hidden="true">↗</span>
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mobile-nav-social-btn"
                      aria-label="Follow The Pancake Club on Instagram"
                    >
                      <InstagramIcon size={15} />
                      <span>Instagram</span>
                      <span className="m-ext-arrow" aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Store Location & Hours Footer */}
            <div className="mobile-nav-store-footer">
              <p className="mobile-nav-store-addr">
                📍 {cleanAddress}
              </p>
              <p className="mobile-nav-store-time">
                Open Daily · 11:00 AM – 9:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

