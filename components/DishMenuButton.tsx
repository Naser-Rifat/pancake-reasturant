"use client";

import { TOGGLE_MENU_EVENT } from "@/components/BottomBar";

/** The "⋯" slot in the dish page's app bar. The dish page hides the site nav
 *  pill on phones, so this is how the menu panel stays reachable — it fires the
 *  same event the bottom bar's More tab does, so there is still one menu. */
export default function DishMenuButton() {
  return (
    <button
      type="button"
      className="dish-topbar-more"
      aria-label="Open menu"
      onClick={() => window.dispatchEvent(new Event(TOGGLE_MENU_EVENT))}
    >
      <span aria-hidden="true">•••</span>
    </button>
  );
}
