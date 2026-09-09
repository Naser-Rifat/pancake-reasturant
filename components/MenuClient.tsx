"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TAG_LABEL,
  telHref,
  type ApiMenuItem,
} from "@/lib/api";
import { useCart } from "@/lib/cart";
import DishCard from "@/components/DishCard";

const TAG_ORDER = ["sweet", "savoury", "choc"] as const;

const CATEGORY_ICONS: Record<string, string> = {
  sweet: "🍯",
  savoury: "🥑",
  choc: "🍫",
};

export default function MenuClient({
  items,
  live = true,
  phone: restaurantPhone = "(02) 5550 1234",
  pauseMessage = "",
  uberEatsUrl = "",
}: {
  items: ApiMenuItem[];
  live?: boolean;
  phone?: string;
  pauseMessage?: string;
  uberEatsUrl?: string;
}) {
  // cart data and the drawer both live in lib/cart now, so the dish page can
  // add to the order and open it without coming back here
  const { loaded, add: addToCart, reconcile, showToast } = useCart();
  const [selectedTag, setSelectedTag] = useState<string>("all");
  // drop slugs that have left the menu, then honour ?add= — the dish page adds
  // in place now, but shared and bookmarked links still land here
  useEffect(() => {
    if (!loaded) return;
    reconcile(items.map((b) => b.slug));
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      window.history.replaceState(null, "", "/menu");
      showToast("Payment cancelled — your order is still in the cart. 🛒");
    }
    const wanted = params.get("add");
    if (!wanted) return;
    const qty = Math.min(9, Math.max(1, parseInt(params.get("qty") || "1", 10) || 1));
    const hit = items.find((b) => b.slug === wanted);
    if (hit) {
      addToCart(wanted, qty);
      window.history.replaceState(null, "", "/menu");
      showToast(`${hit.name} added to your order 🥞`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loaded]);

  const itemBySlug = (slug: string) => items.find((b) => b.slug === slug)!;


  const add = (slug: string) => {
    addToCart(slug);
    showToast(`${itemBySlug(slug).name} added to your order 🥞`);
  };


  const visibleTags =
    selectedTag === "all" ? TAG_ORDER : TAG_ORDER.filter((t) => t === selectedTag);

  return (
    <>
      <main className="container menu-page-container">
        {!live && (
          <div
            className="ordering-paused-box"
            role="status"
          >
            <p style={{ margin: 0, fontWeight: 500 }}>
              {pauseMessage || "Online ordering is temporarily paused."} Call us on{" "}
              <a
                href={telHref(restaurantPhone)}
                style={{ textDecoration: "underline", fontWeight: 700 }}
              >
                {restaurantPhone}
              </a>{" "}
              to place an order.
            </p>
            {uberEatsUrl && (
              <a
                href={uberEatsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.9rem",
                  padding: "0.7rem 1.5rem",
                  borderRadius: "999px",
                  background: "#06C167",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(6, 193, 103, 0.3)",
                }}
              >
                🛵 Order on Uber Eats
              </a>
            )}
          </div>
        )}

        {/* Retro Category Filter Tabs */}
        <div className="menu-filter-bar">
          <button
            type="button"
            className={`menu-filter-chip ${selectedTag === "all" ? "active" : ""}`}
            onClick={() => setSelectedTag("all")}
          >
            <span>✨ All Stacks</span>
            <small className="filter-count">{items.length}</small>
          </button>
          {TAG_ORDER.map((tag) => {
            const countForTag = items.filter((b) => b.tag === tag).length;
            if (countForTag === 0) return null;
            return (
              <button
                key={tag}
                type="button"
                className={`menu-filter-chip ${selectedTag === tag ? "active" : ""}`}
                onClick={() => setSelectedTag(tag)}
              >
                <span>
                  {CATEGORY_ICONS[tag]} {TAG_LABEL[tag]}
                </span>
                <small className="filter-count">{countForTag}</small>
              </button>
            );
          })}
        </div>

        {/* Segmented Boutique Diner Menu Boards */}
        <div className="menu-boards-container">
          {visibleTags.map((tag) => {
            const group = items.filter((b) => b.tag === tag);
            if (group.length === 0) return null;

            return (
              <section className="menu-cat-board" key={tag}>
                <div className="menu-board-header">
                  <div className="board-header-left">
                    <span className="board-cat-icon">{CATEGORY_ICONS[tag]}</span>
                    <h2 className="board-cat-title">{TAG_LABEL[tag]} Stacks</h2>
                  </div>
                  <span className="board-items-badge">
                    {group.length} {group.length === 1 ? "Dish" : "Dishes"}
                  </span>
                </div>

                <div className="menu-board-rows">
                  {group.map((b) => (
                    <DishCard
                      item={b}
                      variant="row"
                      key={b.slug}
                      onAdd={live ? add : undefined}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

    </>
  );
}
