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
import { CalendarDays, House, Menu as MenuIcon, UtensilsCrossed } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/menu", label: "Menu", Icon: UtensilsCrossed },
  { href: "/booking", label: "Book", Icon: CalendarDays },
];

export const TOGGLE_MENU_EVENT = "pancakeclub:toggle-menu";

export default function BottomBar() {
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
            className={`tabbar-item${active ? " on" : ""}`}
            aria-current={active ? "page" : undefined}
            tabIndex={shown ? undefined : -1}
          >
            <span className="tabbar-icon">
              <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="tabbar-label">{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="tabbar-item"
        onClick={() => window.dispatchEvent(new Event(TOGGLE_MENU_EVENT))}
        tabIndex={shown ? undefined : -1}
      >
        <span className="tabbar-icon">
          <MenuIcon size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="tabbar-label">More</span>
      </button>
    </nav>
  );
}

