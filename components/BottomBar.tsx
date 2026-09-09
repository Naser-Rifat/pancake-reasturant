"use client";

// Mobile/tablet bottom tab bar. The hero fold keeps its own floating chrome
// (logo + burger on the photo); this takes over once the hero is behind you,
// so navigation lives in the thumb zone instead of a 38px top-right corner.
// Desktop never sees it — globals.css hides it from 1024px up.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Menu as MenuIcon, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/lib/cart";

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/menu", label: "Menu", Icon: UtensilsCrossed },
  { href: "/booking", label: "Book", Icon: CalendarDays },
];

/** Nav owns the menu panel; the More tab reuses it rather than shipping a
 *  second list that would drift out of sync with the burger's. */
export const TOGGLE_MENU_EVENT = "pancakeclub:toggle-menu";

export default function BottomBar() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const hero = document.querySelector(".hero");
    // pages without a hero (menu, booking, gallery) show the bar immediately
    if (!hero) {
      setShown(true);
      return;
    }
    // two thresholds, not one: a single line makes the bar flicker in and out
    // when you scroll around it
    const onScroll = () => {
      const h = (hero as HTMLElement).offsetHeight || window.innerHeight;
      const y = window.scrollY;
      setShown((was) => (was ? y > h * 0.4 : y > h * 0.7));
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
              <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
              {/* an order in progress is only visible on the menu page's own
                  FAB; this carries it to every other screen */}
              {href === "/menu" && count > 0 && (
                <span className="tabbar-badge" aria-label={`${count} in your order`}>
                  {count}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="tabbar-item"
        onClick={() => window.dispatchEvent(new Event(TOGGLE_MENU_EVENT))}
        tabIndex={shown ? undefined : -1}
      >
        <MenuIcon size={21} strokeWidth={2.2} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
