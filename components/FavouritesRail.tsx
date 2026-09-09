"use client";

// Category count pills + the favourites tile grid, shared by both designs.
// The pills filter the grid — they look like controls, so they behave like them.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import DishCard from "@/components/DishCard";
import { useCart } from "@/lib/cart";
import { TAG_LABEL, type ApiMenuItem } from "@/lib/api";

const TAGS: ApiMenuItem["tag"][] = ["sweet", "savoury", "choc"];
// Four, not eight: on phones and tablets each favourite now gets a full-width
// card identical to the /menu page's. At eight the home page showed the entire
// menu in the same cards as /menu, and "View Full Menu" led nowhere new — four
// keeps this a teaser and leaves the full list a reason to exist.
const MAX = 4;

const SKIN = {
  v1: {
    head: "fav-head", h: "fav-h", tabs: "fav-tabs", pill: "fav-pill", tints: ["a", "b", "c"],
    rail: "fav-grid", card: "fav-card", sub: "fav-head sub", subText: "fav-sub",
    foot: "fav-foot", cta: "btn btn-primary",
  },
  v2: {
    head: "v2-band-head", h: "", tabs: "v2-pill-rows", pill: "v2-pill", tints: ["gold", "sky", "lav"],
    rail: "v2-favs-grid", card: "v2-fav", sub: "v2-band-head sub", subText: "v2-favs-sub",
    foot: "", cta: "v2-btn small",
  },
} as const;

export default function FavouritesRail({
  items,
  variant = "v1",
  live = false,
  title,
  subhead,
  cta,
}: {
  items: ApiMenuItem[];
  variant?: keyof typeof SKIN;
  /** ordering open? false hides the add button, same as /menu does */
  live?: boolean;
  /** headline block sitting opposite the category pills — host elements only:
   *  passing components (e.g. <Link>) across the server→client boundary trips
   *  React's key validation */
  title: ReactNode;
  /** optional second heading between the pills and the rail */
  subhead?: { title: string; text: string };
  /** "view full menu" link — inside the subhead when there is one, else under the rail */
  cta?: { href: string; label: string };
}) {
  const [tab, setTab] = useState<"all" | ApiMenuItem["tag"]>("all");
  const { add, showToast } = useCart();
  const s = SKIN[variant];

  // This rail shows 4 of the 7 dishes in the same card /menu uses, so without
  // an add button the same card meant "tap to open" here and "tap to order"
  // there. The cart is global now — the header's button and its badge react
  // from any page — so adding from the home rail lands somewhere visible.
  const addToOrder = (slug: string) => {
    const hit = items.find((i) => i.slug === slug);
    add(slug);
    showToast(`${hit?.name ?? "Item"} added to your order 🥞`);
  };

  const counts = TAGS.map((tag) => ({ tag, count: items.filter((i) => i.tag === tag).length })).filter(
    (c) => c.count > 0
  );
  const shown = (tab === "all" ? items : items.filter((i) => i.tag === tab)).slice(0, MAX);

  return (
    <>
      <div className={s.head}>
        <div className={s.h}>{title}</div>
        <div className={s.tabs} role="tablist" aria-label="Menu categories">
          <button
            role="tab"
            aria-selected={tab === "all"}
            className={`${s.pill}${tab === "all" ? " on" : ""}`}
            onClick={() => setTab("all")}
          >
            All Stacks <span className="n">{items.length}</span>
          </button>
          {counts.map((c, i) => (
            <button
              key={c.tag}
              role="tab"
              aria-selected={tab === c.tag}
              className={`${s.pill} ${s.tints[i % s.tints.length]}${tab === c.tag ? " on" : ""}`}
              onClick={() => setTab(c.tag)}
            >
              {TAG_LABEL[c.tag]} <span className="n">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {subhead && (
        <div className={s.sub}>
          <div>
            <h2>{subhead.title}</h2>
            <p className={s.subText}>{subhead.text}</p>
          </div>
          {cta && <Link href={cta.href} className={s.cta}>{cta.label}</Link>}
        </div>
      )}

      <div className={s.rail}>
        {shown.map((m) => (
          <DishCard
            item={m}
            variant="tile"
            key={m.slug}
            onAdd={live ? addToOrder : undefined}
          />
        ))}
      </div>

      {cta && !subhead && (
        <div className={s.foot}>
          <Link href={cta.href} className={s.cta}>{cta.label}</Link>
        </div>
      )}
    </>
  );
}
