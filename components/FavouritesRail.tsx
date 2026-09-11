"use client";

// Category count pills + the favourites tile grid, shared by both designs.
// The pills filter the grid — they look like controls, so they behave like them.

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import DishCard from "@/components/DishCard";
import { useCart } from "@/lib/cart";
import { TAG_LABEL, type ApiMenuItem } from "@/lib/api";

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
  const [tab, setTab] = useState<string>("all");
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

  const dynamicCategories = useMemo(() => {
    const map = new Map<string, { slug: string; label: string; count: number }>();
    for (const item of items) {
      const slug = item.category_slug || item.tag;
      const label = item.category_name || TAG_LABEL[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
      if (!map.has(slug)) {
        map.set(slug, { slug, label, count: 0 });
      }
      map.get(slug)!.count += 1;
    }
    return Array.from(map.values());
  }, [items]);

  const shown = (
    tab === "all"
      ? items
      : items.filter((i) => (i.category_slug || i.tag) === tab)
  ).slice(0, MAX);

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
          {dynamicCategories.map((c, i) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={tab === c.slug}
              className={`${s.pill} ${s.tints[i % s.tints.length]}${tab === c.slug ? " on" : ""}`}
              onClick={() => setTab(c.slug)}
            >
              {c.label} <span className="n">{c.count}</span>
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
