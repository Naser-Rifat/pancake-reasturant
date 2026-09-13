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

/**
 * Custom vector icon matching the reference design:
 * A boutique shopping bag outline with a centered plus sign.
 */
function BagPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
      <line x1="12" y1="12.5" x2="12" y2="16.5" strokeWidth="2.2" />
      <line x1="10" y1="14.5" x2="14" y2="14.5" strokeWidth="2.2" />
    </svg>
  );
}

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
  // The image chosen by the admin:
  // 1. item.photo is the Main photo designated by the admin in the catalog editor
  // 2. item.image is the cutout image set by the admin
  // 3. Fallback placeholder only if neither was provided
  const src = item.photo || item.image || "/menu/buttermilk.png";

  // A transparent cutout is used if the admin chose a cutout asset or when only a cutout exists
  const isCutout = Boolean(
    (!item.photo && Boolean(item.image)) ||
    src.includes("cutout") ||
    (src.startsWith("/menu/") && !src.includes("photo"))
  );
  const catIcon = item.category_icon || item.category?.icon || TAG_ICONS[item.tag] || "🥞";
  const catLabel = item.category_name || item.category?.name || TAG_LABEL[item.tag] || item.tag;

  const isRow = variant === "row";

  return (
    <article className={`dish-card dc-${variant}`}>
      {/* the whole card is the target; the name keeps its own anchor for AT */}
      <Link href={href} className="dc-hit" aria-label={`View ${item.name} details`} />

      <div className="dc-body">
        {isRow && dealBadge && (
          <div className="dc-badge-row">
            <span className="dc-badge dc-badge-featured">{dealBadge}</span>
          </div>
        )}

        <div className={`dc-head${isRow ? " dc-head-row" : ""}`}>
          {dealBadge && !isRow ? (
            <span className="dc-badge dc-badge-featured">{dealBadge}</span>
          ) : (
            <span className={`dc-badge tag-${item.category_slug || item.tag}`}>
              <span aria-hidden="true">{catIcon}</span>
              <span>{catLabel}</span>
            </span>
          )}
          <span className="dc-dots" aria-hidden="true" />
          <span className="dc-price dc-price-head">{money(item.price)}</span>
        </div>

        <h3 className="dc-name">
          <Link href={href}>{item.name}</Link>
        </h3>

        {/* Sub-price only rendered for the mobile row variant */}
        {isRow && (
          <span className="dc-price dc-price-sub">{money(item.price)}</span>
        )}

        {item.description && <p className="dc-desc">{item.description}</p>}
      </div>

      <div className="dc-media">
        <div className="dc-photo">
          {src && (
            <Image
              src={src}
              alt={`${item.name} pancakes`}
              width={420}
              height={420}
              sizes="(min-width: 1024px) 25vw, 380px"
              className={`dc-img${isCutout ? " is-cutout" : ""}`}
            />
          )}
        </div>
      </div>

      <div className="dc-actions">
        <Link href={href} className="dc-details">
          <span>Details</span>
          <ArrowRight size={13} />
        </Link>
        {onAdd && (
          <>
            <button
              type="button"
              className="dc-add dc-add-desktop"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd(item.slug);
              }}
              aria-label={`Add ${item.name} to order`}
            >
              <Plus size={14} strokeWidth={2.75} />
              <span>Add</span>
            </button>
            {isRow && (
              <button
                type="button"
                className="dc-add dc-add-bag"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAdd(item.slug);
                }}
                aria-label={`Add ${item.name} to order`}
              >
                <BagPlusIcon />
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

