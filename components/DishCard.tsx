"use client";

// The one dish card. There used to be three:
//
//   .fav-card        home rail    — photo tile, name and price under it
//   .diner-dish-row  /menu        — desktop row, mobile card
//   .fav-diner-card  dish page    — badge + price pill + description + CTA,
//                                   inline in the page, 447px tall on a phone
//
// Three hand-built layouts for one object, so a change to "the dish card" meant
// finding all three and usually missing one. The third was already marked
// "kept as-is" in globals.css — a leftover from a redesign that only landed on
// the other two.
//
// One markup now, two skins:
//   tile — home rail and the dish page's "you might also like"
//   row  — /menu, which is a list: a row on desktop, this same card on phones
//
// Everything below the name is optional and only the row skin asks for it, so
// the phone card is the same object everywhere.

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import { TAG_LABEL, money, type ApiMenuItem } from "@/lib/api";

export const TAG_ICONS: Record<string, string> = {
  sweet: "🍯",
  savoury: "🥑",
  choc: "🍫",
};

export default function DishCard({
  item,
  variant = "tile",
  onAdd,
  dealBadge,
}: {
  item: ApiMenuItem;
  variant?: "tile" | "row";
  /** omit to hide the add button — ordering paused, or a context that only links */
  onAdd?: (slug: string) => void;
  /** special offer / promo deal badge */
  dealBadge?: string;
}) {
  const href = `/menu/${item.slug}`;
  let src = item.image || item.photo;
  // Savannah Mack's raw Cloudinary upload includes a stray floating cup artifact
  // and non-standard aspect ratio. Use the clean, isolated cutout asset instead.
  if (item.slug === "savannah-mack" && (!src || src.includes("lmhxhhzx21ft2vhusuji"))) {
    src = "/menu/savannah-clean.png";
  }
  // a cutout stands on the card floor with a white keyline; a real photo is a
  // rectangle and gets cropped instead — the two need different treatment
  const isCutout = Boolean(item.image || src.startsWith("/menu/"));
  const catIcon = item.category_icon || item.category?.icon || TAG_ICONS[item.tag] || "🥞";
  const catLabel = item.category_name || item.category?.name || TAG_LABEL[item.tag] || item.tag;

  return (
    <article className={`dish-card dc-${variant}`}>
      {/* the whole card is the target; the name keeps its own anchor for AT */}
      <Link href={href} className="dc-hit" aria-label={`View ${item.name} details`} />

      <div className="dc-photo">
        {src && (
          <Image
            src={src}
            alt={`${item.name} pancakes`}
            width={320}
            height={320}
            sizes="(min-width: 1024px) 25vw, 45vw"
            className={`dc-img${isCutout ? " is-cutout" : ""}`}
          />
        )}
      </div>

      <div className="dc-body">
        <div className="dc-head">
          <span className={`dc-badge tag-${item.category_slug || item.tag}`}>
            <span aria-hidden="true">{catIcon}</span>
            <span>{catLabel}</span>
          </span>
          <span className="dc-dots" aria-hidden="true" />
          <span className="dc-price">{money(item.price)}</span>
        </div>

        <h3 className="dc-name">
          <Link href={href}>{item.name}</Link>
          {dealBadge && <span className="dc-deal-pill">{dealBadge}</span>}
        </h3>

        <p className="dc-desc">{item.description}</p>

        <div className="dc-chips">
          {item.kcal != null && <span className="dc-chip">🔥 {item.kcal} kcal</span>}
          {item.protein_g != null && <span className="dc-chip">💪 {item.protein_g}g protein</span>}
          {item.prep_time && <span className="dc-chip">⏱ {item.prep_time}</span>}
        </div>
      </div>

      <div className="dc-actions">
        <Link href={href} className="dc-details">
          <span>Details</span>
          <ArrowRight size={13} />
        </Link>
        {onAdd && (
          <button
            type="button"
            className="dc-add"
            onClick={() => onAdd(item.slug)}
            aria-label={`Add ${item.name} to order`}
          >
            <Plus size={14} strokeWidth={2.75} />
            <span>Add</span>
          </button>
        )}
      </div>
    </article>
  );
}
