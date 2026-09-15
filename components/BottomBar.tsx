"use client";

// Mobile/tablet bottom tab bar.
// On the homepage, navigation lives on the hero itself (Book a Table & Explore Menu).
// This bar takes over smoothly once you scroll past the hero fold, so navigation
// lives in the thumb zone without duplicating the hero action buttons.
// On subpages (menu, booking, gallery), it is visible from first paint.
// Desktop never sees it — globals.css hides it from 1024px up.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeDinerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 10.2L10.8 3.8C11.5 3.2 12.5 3.2 13.2 3.8L20.5 10.2" />
      <path d="M5.5 8.5V18.5C5.5 19.6 6.4 20.5 7.5 20.5H16.5C17.6 20.5 18.5 19.6 18.5 18.5V8.5" />
      <path d="M9.8 20.5V14.2C9.8 13.2 10.7 12.4 11.8 12.4H12.2C13.3 12.4 14.2 13.2 14.2 14.2V20.5" />
    </svg>
  );
}

function PancakeMenuIcon({ size = 21 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 19.2C6.5 21.2 17.5 21.2 21.5 19.2" strokeWidth="2.1" />
      <path d="M4.5 15.8C5.8 17.8 18.2 17.8 19.5 15.8" />
      <path d="M4.5 12.2C5.8 14.2 18.2 14.2 19.5 12.2" />
      <ellipse cx="12" cy="8.6" rx="7.5" ry="3" strokeWidth="2" />
      <rect
        x="10.2"
        y="4.2"
        width="3.6"
        height="3"
        rx="0.9"
        fill="currentColor"
        fillOpacity="0.28"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ReservationCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="16" rx="4" />
      <path d="M3.5 9.5H20.5" strokeWidth="1.8" />
      <path d="M8 2.5V5.5" strokeWidth="2.2" />
      <path d="M16 2.5V5.5" strokeWidth="2.2" />
      <circle cx="12" cy="14.8" r="3.2" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 13.5V14.8L13.2 15.6" strokeWidth="1.6" />
    </svg>
  );
}

function WhatsAppDinerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function OrganicMenuIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Home", Icon: HomeDinerIcon },
  { href: "/menu", label: "Menu", Icon: PancakeMenuIcon },
  { href: "/booking", label: "Book", Icon: ReservationCalendarIcon },
];

export const TOGGLE_MENU_EVENT = "pancakeclub:toggle-menu";

interface BottomBarProps {
  whatsapp?: string;
}

export default function BottomBar({ whatsapp }: BottomBarProps) {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Pages without a hero (menu, booking, gallery, etc.) show the bar immediately
    const hero = document.querySelector(".hero");
    if (!hero) {
      setShown(true);
      return;
    }

    // On homepage, reveal as soon as scrolling starts (y > 40px) and hide at top (y <= 20px)
    const onScroll = () => {
      const y = window.scrollY;
      setShown((was) => (was ? y > 20 : y > 40));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // the standalone live-preview route renders without site chrome, same as Nav
  if (pathname === "/preview" || pathname?.startsWith("/preview")) return null;

  const whatsappDigits = whatsapp ? whatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi The Pancake Club! I'd like to make an enquiry.")}`
    : "https://wa.me/?text=Hi%20The%20Pancake%20Club!";

  return (
    <nav
      className={`tabbar${shown ? " on" : ""}`}
      aria-label="Primary"
      aria-hidden={!shown}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={(e) => {
              if (href === "/" && pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`tabbar-item${active ? " on" : ""}`}
            aria-current={active ? "page" : undefined}
            tabIndex={shown ? undefined : -1}
          >
            <span className="tabbar-icon">
              <Icon size={21} />
            </span>
            <span className="tabbar-label">{label}</span>
          </Link>
        );
      })}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="tabbar-item tabbar-chat"
        aria-label="Chat with us on WhatsApp"
        title="Chat on WhatsApp"
        tabIndex={shown ? undefined : -1}
      >
        <span className="tabbar-icon">
          <WhatsAppDinerIcon size={20} />
        </span>
        <span className="tabbar-label">Chat</span>
      </a>

      <button
        type="button"
        className="tabbar-item"
        onClick={() => window.dispatchEvent(new Event(TOGGLE_MENU_EVENT))}
        tabIndex={shown ? undefined : -1}
        aria-label="Open More Menu"
      >
        <span className="tabbar-icon">
          <OrganicMenuIcon size={20} />
        </span>
        <span className="tabbar-label">More</span>
      </button>
    </nav>
  );
}

