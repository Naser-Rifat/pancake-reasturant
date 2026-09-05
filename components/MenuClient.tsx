"use client";

import { useEffect, useRef, useState } from "react";
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

const CART_KEY = "krush-cart-v2";
const TAG_ORDER = ["sweet", "savoury", "choc"] as const;

const CATEGORY_ICONS: Record<string, string> = {
  sweet: "🍯",
  savoury: "🥑",
  choc: "🍫",
};

type Cart = Record<string, number>;

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
  const [cart, setCart] = useState<Cart>({});
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [pop, setPop] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate cart from localStorage, dropping slugs that left the menu
  useEffect(() => {
    try {
      const saved: Cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      Object.keys(saved).forEach((slug) => {
        if (!items.some((b) => b.slug === slug)) delete saved[slug];
      });
      const params = new URLSearchParams(window.location.search);
      const wanted = params.get("add");
      const qty = Math.min(9, Math.max(1, parseInt(params.get("qty") || "1", 10) || 1));
      if (wanted && items.some((b) => b.slug === wanted)) {
        saved[wanted] = (saved[wanted] || 0) + qty;
        localStorage.setItem(CART_KEY, JSON.stringify(saved));
        window.history.replaceState(null, "", "/menu");
        showToast(`${items.find((b) => b.slug === wanted)!.name} added to your order 🥞`);
      }
      setCart(saved);
    } catch {
      /* corrupted storage — start fresh */
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const itemBySlug = (slug: string) => items.find((b) => b.slug === slug)!;
  const priceOf = (slug: string) => parseFloat(itemBySlug(slug).price);

  const count = Object.values(cart).reduce((s, q) => s + q, 0);
  const total = Object.entries(cart).reduce((s, [slug, q]) => s + priceOf(slug) * q, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  // one line can hold at most 9 — matches QtyAdd and the ?add= URL path
  const MAX_QTY = 9;
  const add = (slug: string) => {
    setCart((c) => ({ ...c, [slug]: Math.min(MAX_QTY, (c[slug] || 0) + 1) }));
    setPop(false);
    requestAnimationFrame(() => setPop(true));
    showToast(`${itemBySlug(slug).name} added to your order 🥞`);
  };

  const inc = (slug: string) => setCart((c) => ({ ...c, [slug]: Math.min(MAX_QTY, c[slug] + 1) }));
  const dec = (slug: string) =>
    setCart((c) => {
      const next = { ...c, [slug]: c[slug] - 1 };
      if (next[slug] <= 0) delete next[slug];
      return next;
    });

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
      setCart({});
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
                        <div className="diner-dish-thumb">
                          {(b.image || b.photo) && (
                            <Image
                              src={b.image || b.photo}
                              alt={`${b.name} pancakes`}
                              width={160}
                              height={160}
                              sizes="80px"
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
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
