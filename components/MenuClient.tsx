"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TAG_LABEL,
  telHref,
  type ApiMenuItem,
  type ApiAnnouncement,
  type ApiCategory,
} from "@/lib/api";
import { useCart } from "@/lib/cart";
import DishCard from "@/components/DishCard";

const CATEGORY_ICONS: Record<string, string> = {
  sweet: "🍯",
  savoury: "🥑",
  choc: "🍫",
};

export default function MenuClient({
  items,
  categories = [],
  campaigns = [],
  live = true,
  phone: restaurantPhone = "(02) 5550 1234",
  pauseMessage = "",
  uberEatsUrl = "",
}: {
  items: ApiMenuItem[];
  categories?: ApiCategory[];
  campaigns?: ApiAnnouncement[];
  live?: boolean;
  phone?: string;
  pauseMessage?: string;
  uberEatsUrl?: string;
}) {
  // cart data and drawer both live in lib/cart now
  const { loaded, add: addToCart, openCart, reconcile, setCouponCode, showToast } = useCart();
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Identify dishes associated with active campaigns or house specials
  const dealItems = items.filter((item) => {
    if (item.is_featured) return true;
    return campaigns.some((c) => {
      const matchSlug = c.card1_dish === item.slug || c.card2_dish === item.slug;
      const matchText =
        c.message.toLowerCase().includes(item.slug.toLowerCase()) ||
        c.message.toLowerCase().includes(item.name.toLowerCase()) ||
        c.details.toLowerCase().includes(item.name.toLowerCase()) ||
        (item.slug === "buttermilk" && c.message.toLowerCase().includes("buttermilk"));
      return matchSlug || matchText;
    });
  });

  const getDealBadge = (slug: string) => {
    const campaign = campaigns.find((c) => {
      return (
        c.card1_dish === slug ||
        c.card2_dish === slug ||
        c.message.toLowerCase().includes(slug) ||
        (slug === "buttermilk" && c.message.toLowerCase().includes("buttermilk"))
      );
    });
    if (campaign) {
      const msg = campaign.message.toLowerCase();
      if (msg.includes("2-for-1") || msg.includes("2 for 1")) return "🔥 2-for-1 Special";
      if (msg.includes("20% off") || msg.includes("20%")) return "🔥 20% Off";
      if (msg.includes("free")) return "🎁 Free Deal";
      return "🔥 Special Deal";
    }
    const item = items.find((i) => i.slug === slug);
    if (item?.is_featured) return "⭐ House Favourite";
    return undefined;
  };

  // Handle URL query parameters (?tag=deals, ?coupon=..., ?add=...)
  useEffect(() => {
    if (!loaded) return;
    reconcile(items.map((b) => b.slug));
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      window.history.replaceState(null, "", "/menu");
      showToast("Payment cancelled — your order is still in the cart. 🛒");
    }

    // Switch to deals tab if requested
    const tagParam = params.get("tag");
    if (tagParam === "deals" || params.get("deal") || params.get("special")) {
      setSelectedTag("deals");
    } else if (tagParam) {
      setSelectedTag(tagParam);
    }

    // Pre-apply coupon code from URL
    const coupon = params.get("coupon");
    if (coupon) {
      setCouponCode(coupon.toUpperCase());
      showToast(`Coupon "${coupon.toUpperCase()}" applied! 🎉`);
    }

    const wanted = params.get("add");
    if (!wanted) return;
    const qty = Math.min(9, Math.max(1, parseInt(params.get("qty") || "1", 10) || 1));
    const hit = items.find((b) => b.slug === wanted);
    if (hit) {
      addToCart(wanted, qty);
      openCart();
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

  const displayCategories = useMemo(() => {
    const list: { slug: string; name: string; icon: string; sort_order: number }[] = [];
    const seen = new Set<string>();

    for (const c of categories) {
      if (!c.is_active) continue;
      seen.add(c.slug);
      list.push({
        slug: c.slug,
        name: c.name,
        icon: c.icon || "🥞",
        sort_order: c.sort_order,
      });
    }

    for (const item of items) {
      const slug = item.category_slug || item.tag;
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        list.push({
          slug,
          name: item.category_name || TAG_LABEL[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1)),
          icon: item.category_icon || CATEGORY_ICONS[slug] || "🥞",
          sort_order: 99,
        });
      }
    }

    return list.sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, items]);

  const visibleCategories =
    selectedTag === "all"
      ? displayCategories
      : displayCategories.filter((c) => c.slug === selectedTag);

  return (
    <>
      <main className="container menu-page-container">
        {!live && (
          <div className="ordering-paused-box" role="status">
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

          {dealItems.length > 0 && (
            <button
              type="button"
              className={`menu-filter-chip chip-deals ${selectedTag === "deals" ? "active" : ""}`}
              onClick={() => setSelectedTag("deals")}
            >
              <span>🔥 Special Deals</span>
              <small className="filter-count">{dealItems.length}</small>
            </button>
          )}

          {displayCategories.map((cat) => {
            const countForTag = items.filter(
              (b) => (b.category_slug ? b.category_slug === cat.slug : b.tag === cat.slug)
            ).length;
            if (countForTag === 0) return null;
            return (
              <button
                key={cat.slug}
                type="button"
                className={`menu-filter-chip ${selectedTag === cat.slug ? "active" : ""}`}
                onClick={() => setSelectedTag(cat.slug)}
              >
                <span>
                  {cat.icon} {cat.name}
                </span>
                <small className="filter-count">{countForTag}</small>
              </button>
            );
          })}
        </div>

        {/* Active Promotional Deals Banner (shown when Deals tab is active) */}
        {selectedTag === "deals" && (
          <div className="menu-deals-banner">
            <div className="deals-banner-header">
              <span className="deals-kicker">Fresh Off the Griddle</span>
              <h3>🎉 Weekly Specials & Limited Deals</h3>
              <p>Special perks & promotions griddled with love — available in-store and online.</p>
            </div>

            {campaigns.length > 0 && (
              <div className="deals-cards-grid">
                {campaigns.map((c) => {
                  const isBooking = c.link_url?.includes("booking");
                  return (
                    <div className="deals-ticket-card" key={c.message}>
                      <div className="ticket-tag">
                        {isBooking ? "🍽️ Dine-In Special" : "🥞 Takeaway Offer"}
                      </div>
                      <h4>{c.message}</h4>
                      {c.details && <p className="ticket-details">{c.details}</p>}
                      {c.link_url && (
                        <div className="ticket-action">
                          <Link href={c.link_url} className="ticket-btn">
                            <span>
                              {c.link_text || (isBooking ? "Book a Table" : "Explore Deal")}
                            </span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dishes on Special */}
            <section className="menu-cat-board menu-deals-board">
              <div className="menu-board-header">
                <div className="board-header-left">
                  <span className="board-cat-icon">🔥</span>
                  <h2 className="board-cat-title">Special Offer Stacks</h2>
                </div>
                <span className="board-items-badge">
                  {dealItems.length} {dealItems.length === 1 ? "Dish" : "Dishes"}
                </span>
              </div>

              <div className="menu-board-rows">
                {dealItems.map((b) => (
                  <DishCard
                    item={b}
                    variant="row"
                    key={b.slug}
                    onAdd={live ? add : undefined}
                    dealBadge={getDealBadge(b.slug)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Regular Segmented Boutique Diner Menu Boards */}
        {selectedTag !== "deals" && (
          <div className="menu-boards-container">
            {visibleCategories.map((cat) => {
              const group = items.filter(
                (b) => (b.category_slug ? b.category_slug === cat.slug : b.tag === cat.slug)
              );
              if (group.length === 0) return null;

              return (
                <section className="menu-cat-board" key={cat.slug}>
                  <div className="menu-board-header">
                    <div className="board-header-left">
                      <span className="board-cat-icon">{cat.icon}</span>
                      <h2 className="board-cat-title">
                        {cat.name.toLowerCase().includes("stack") || cat.name.toLowerCase().includes("brunch")
                          ? cat.name
                          : `${cat.name} Stacks`}
                      </h2>
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
                        dealBadge={getDealBadge(b.slug)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

    </>
  );
}
