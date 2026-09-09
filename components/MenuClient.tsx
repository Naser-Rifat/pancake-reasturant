"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Plus, ArrowRight } from "lucide-react";
import {
  TAG_LABEL,
  money,
  placeOrder,
  telHref,
  type ApiMenuItem,
} from "@/lib/api";
import { useCart } from "@/lib/cart";

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
  // the cart itself lives in lib/cart so the dish page can add to it too
  const { cart, loaded, count, add: addToCart, inc, dec, clear, reconcile, showToast, addedAt } =
    useCart();
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  // drop slugs that have left the menu, then honour ?add= — the dish page adds
  // in place now, but shared and bookmarked links still land here
  useEffect(() => {
    if (!loaded) return;
    reconcile(items.map((b) => b.slug));
    const params = new URLSearchParams(window.location.search);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const itemBySlug = (slug: string) => items.find((b) => b.slug === slug)!;
  const priceOf = (slug: string) => parseFloat(itemBySlug(slug).price);

  const total = Object.entries(cart).reduce((s, [slug, q]) => s + priceOf(slug) * q, 0);

  // replay the FAB's pop whenever anything lands in the cart, wherever from
  useEffect(() => {
    if (!addedAt) return;
    setPop(false);
    const id = requestAnimationFrame(() => setPop(true));
    return () => cancelAnimationFrame(id);
  }, [addedAt]);

  const add = (slug: string) => {
    addToCart(slug);
    showToast(`${itemBySlug(slug).name} added to your order 🥞`);
  };

  const checkout = async () => {
    if (!count) return showToast("Your order is empty!");
    if (!name.trim()) return showToast("Add your name so we know whose stack it is!");
    setPlacing(true);
    try {
      const order = await placeOrder({
        customer_name: name.trim(),
        phone: phone.trim(),
        items: Object.entries(cart).map(([slug, quantity]) => ({ slug, quantity })),
      });
      clear();
      setOpen(false);
      showToast(`Order received — $${order.total}. See you soon, ${name.trim()}! 🎉`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setPlacing(false);
    }
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
                    <article className="diner-dish-row" key={b.slug}>
                      {/* Food Thumbnail */}
                      <Link
                        href={`/menu/${b.slug}`}
                        className="diner-dish-thumb-link"
                        aria-label={`View ${b.name} details`}
                      >
                        {/* the mobile card floats the art on a tinted ground with a
                            white keyline, which only reads on a transparent cutout —
                            a framed photo would get a rectangle drawn round it */}
                        <div className={`diner-dish-thumb${b.image ? " is-cutout" : ""}`}>
                          {(b.image || b.photo) && (
                            <Image
                              src={b.image || b.photo}
                              alt={`${b.name} pancakes`}
                              width={320}
                              height={320}
                              sizes="(min-width: 1024px) 80px, 45vw"
                              className="diner-dish-img"
                            />
                          )}
                        </div>
                      </Link>

                      {/* Main Dish Details */}
                      <div className="diner-dish-body">
                        <div className="diner-dish-top-row">
                          <h3 className="diner-dish-name">
                            <Link href={`/menu/${b.slug}`}>{b.name}</Link>
                          </h3>
                          <span className="diner-dot-leader" aria-hidden="true" />
                          <span className="diner-price-pill">{money(b.price)}</span>
                        </div>

                        <p className="diner-dish-desc">{b.description}</p>

                        <div className="diner-dish-footer">
                          <div className="diner-chips-row">
                            {b.kcal != null && (
                              <span className="diner-meta-chip">🔥 {b.kcal} kcal</span>
                            )}
                            {b.protein_g != null && (
                              <span className="diner-meta-chip">💪 {b.protein_g}g protein</span>
                            )}
                            {b.prep_time && (
                              <span className="diner-meta-chip">⏱ {b.prep_time}</span>
                            )}
                          </div>

                          <div className="diner-dish-actions">
                            <Link href={`/menu/${b.slug}`} className="diner-view-link">
                              <span>Details</span>
                              <ArrowRight size={13} />
                            </Link>

                            {live && (
                              <button
                                type="button"
                                className="diner-add-btn"
                                onClick={() => add(b.slug)}
                                aria-label={`Add ${b.name} to order`}
                              >
                                <Plus size={14} strokeWidth={2.75} />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Cart Button */}
      {live && (
        <button
          className="cart-fab"
          aria-label="Open cart"
          onClick={() => setOpen(true)}
        >
          <ShoppingCart size={26} strokeWidth={2.2} aria-hidden="true" />
          <span className={`count${pop ? " pop" : ""}`}>{count}</span>
        </button>
      )}

      {/* Backdrop */}
      <div
        className={`cart-backdrop${open ? " show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Cart Drawer */}
      <aside
        className={`cart-drawer${open ? " open" : ""}`}
        aria-label="Shopping cart"
      >
        <div className="cart-head">
          <h3>Your Order</h3>
          <button
            className="cart-close"
            aria-label="Close cart"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="cart-items">
          {count === 0 ? (
            <p className="cart-empty">
              Your order is empty.
              <br />
              Go stack something. 🥞
            </p>
          ) : (
            Object.entries(cart).map(([slug, qty]) => {
              const b = itemBySlug(slug);
              return (
                <div className="cart-item" key={slug}>
                  <Image
                    src={b.image || b.photo}
                    alt={b.name}
                    width={58}
                    height={58}
                  />
                  <div>
                    <div className="n">{b.name}</div>
                    <div className="p">
                      ${parseFloat(b.price)} × {qty} = $
                      {(priceOf(slug) * qty).toFixed(2)}
                    </div>
                  </div>
                  <div className="qty">
                    <button
                      aria-label="Remove one"
                      onClick={() => dec(slug)}
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      aria-label="Add one"
                      onClick={() => inc(slug)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="cart-foot">
          <div className="cart-form">
            <input
              className="input"
              placeholder="Your name *"
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Phone (optional)"
              value={phone}
              autoComplete="tel"
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="cart-total">
            <span>Total</span>
            <b>${total.toFixed(2)}</b>
          </div>
          <button
            className="btn btn-primary"
            onClick={checkout}
            disabled={placing}
          >
            {placing ? "Placing order…" : "Checkout for Pickup →"}
          </button>
          {uberEatsUrl && (
            <a
              href={uberEatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "0.7rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#06C167",
                textDecoration: "underline",
              }}
            >
              Prefer delivery? Order on Uber Eats 🛵
            </a>
          )}
        </div>
      </aside>

      {/* Toast */}
    </>
  );
}
