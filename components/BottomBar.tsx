"use client";

// Mobile/tablet bottom tab bar — the navigation, full stop.
//
// It used to reveal itself only once you had scrolled past the hero, which is
// the one thing an app's tab bar never does: you land, and the app's shape is
// already there. It is up from the first paint now, and the top pill is a thin
// app header (logo + cart) rather than a second copy of these links.
//
// Desktop never sees it — globals.css hides it from 1024px up.

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Menu as MenuIcon, UtensilsCrossed } from "lucide-react";

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

  // the standalone live-preview route renders without site chrome, same as Nav
  if (pathname === "/preview" || pathname?.startsWith("/preview")) return null;

  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`tabbar-item${active ? " on" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="tabbar-icon">
              <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="tabbar-item"
        onClick={() => window.dispatchEvent(new Event(TOGGLE_MENU_EVENT))}
      >
        <MenuIcon size={21} strokeWidth={2.2} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
