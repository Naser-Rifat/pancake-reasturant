"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, ExternalLink } from "lucide-react";
import CartButton from "@/components/CartButton";
import { TOGGLE_MENU_EVENT } from "@/components/BottomBar";
import { cleanAddress } from "@/lib/format";

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

function DrawerHomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 10.2L10.8 3.8C11.5 3.2 12.5 3.2 13.2 3.8L20.5 10.2" />
      <path d="M5.5 8.5V18.5C5.5 19.6 6.4 20.5 7.5 20.5H16.5C17.6 20.5 18.5 19.6 18.5 18.5V8.5" />
      <path d="M9.8 20.5V14.2C9.8 13.2 10.7 12.4 11.8 12.4H12.2C13.3 12.4 14.2 13.2 14.2 14.2V20.5" />
    </svg>
  );
}

function DrawerPancakeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 19.2C6.5 21.2 17.5 21.2 21.5 19.2" strokeWidth="2.1" />
      <path d="M4.5 15.8C5.8 17.8 18.2 17.8 19.5 15.8" />
      <path d="M4.5 12.2C5.8 14.2 18.2 14.2 19.5 12.2" />
      <ellipse cx="12" cy="8.6" rx="7.5" ry="3" strokeWidth="2" />
      <rect x="10.2" y="4.2" width="3.6" height="3" rx="0.9" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function DrawerGalleryIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15L16 10L6 20" />
      <path d="M14 18L18 14L21 17" />
    </svg>
  );
}

function DrawerReviewsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

function DrawerContactIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10C20 16 12 22 12 22C12 22 4 16 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10Z" />
      <circle cx="12" cy="10" r="3" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

function DrawerCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="4" />
      <path d="M3.5 9.5H20.5" strokeWidth="1.8" />
      <path d="M8 2.5V5.5" strokeWidth="2.2" />
      <path d="M16 2.5V5.5" strokeWidth="2.2" />
      <circle cx="12" cy="14.8" r="3.2" strokeWidth="1.8" fill="currentColor" fillOpacity="0.18" />
      <path d="M12 13.5V14.8L13.2 15.6" strokeWidth="1.6" />
    </svg>
  );
}

const LINKS = [
  { href: "/", label: "Home", subtitle: "Welcome & highlights", Icon: DrawerHomeIcon },
  { href: "/menu", label: "Menu", subtitle: "Fresh stacks & drinks", Icon: DrawerPancakeIcon },
  { href: "/gallery", label: "Gallery", subtitle: "Vibes & diner moments", Icon: DrawerGalleryIcon },
  { href: "/join-our-club", label: "Join Our Club", subtitle: "Good food, better company", Icon: DrawerReviewsIcon },
  { href: "/#reviews", label: "Reviews", subtitle: "Loved by locals", Icon: DrawerReviewsIcon },
  { href: "/#contact", label: "Contact", subtitle: "Location & opening hours", Icon: DrawerContactIcon },
];

export default function Nav({
  live = true,
  facebookUrl,
  instagramUrl,
  uberEatsUrl,
  whatsapp,
  address = "",
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

  const displayAddress = cleanAddress(address);
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
                const Icon = l.Icon;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`mobile-nav-item${isActive ? " active" : ""}`}
                      onClick={l.href === "/" ? handleDrawerHomeClick : () => setOpen(false)}
                    >
                      <div className="mobile-nav-item-left">
                        <span className="mobile-nav-item-icon-box">
                          <Icon size={19} />
                        </span>
                        <div className="mobile-nav-item-text">
                          <span className="mobile-nav-item-label">{l.label}</span>
                          <span className="mobile-nav-item-sub">{l.subtitle}</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="mobile-nav-item-arrow" aria-hidden="true" />
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
                  <div className="mobile-nav-item-left">
                    <span className="mobile-nav-item-icon-box book-icon-box">
                      <DrawerCalendarIcon size={19} />
                    </span>
                    <div className="mobile-nav-item-text">
                      <span className="mobile-nav-item-label">Book a Table</span>
                      <span className="mobile-nav-item-sub">Instant table reservation</span>
                    </div>
                  </div>
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
                  <div className="m-uber-left">
                    <span className="m-uber-badge">🛵</span>
                    <div className="m-uber-text-wrap">
                      <span className="m-uber-title">Order on Uber Eats</span>
                      <span className="m-uber-sub">Delivery straight to your door</span>
                    </div>
                  </div>
                  <span className="m-uber-pill-tag">Order ↗</span>
                </a>
              )}
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi The Pancake Club! I'd like to make an enquiry.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-drawer-wa-pill"
                >
                  <div className="m-wa-left">
                    <span className="m-wa-badge">💬</span>
                    <div className="m-wa-text-wrap">
                      <span className="m-wa-title">Chat on WhatsApp</span>
                      <span className="m-wa-sub">Quick answers &amp; enquiries</span>
                    </div>
                  </div>
                  <ExternalLink size={15} className="m-wa-arrow" aria-hidden="true" />
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
              {displayAddress && (
                <div className="mobile-nav-store-item">
                  <span className="m-store-icon">📍</span>
                  <span className="m-store-text">{displayAddress}</span>
                </div>
              )}
              <div className="mobile-nav-store-item">
                <span className="m-store-icon">⏰</span>
                <span className="m-store-text">Open Daily · 11:00 AM – 9:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
