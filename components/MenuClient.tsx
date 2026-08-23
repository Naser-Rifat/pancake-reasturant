"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import {
  TAG_LABEL,
  heatClass,
  placeOrder,
  telHref,
  type ApiMenuItem,
} from "@/lib/api";

const CART_KEY = "krush-cart-v2";

type Cart = Record<string, number>;

export default function MenuClient({
  items,
  live = true,
  phone: restaurantPhone = "(02) 5550 1234",
}: {
  items: ApiMenuItem[];
  live?: boolean;
  phone?: string;
}) {
  const [cart, setCart] = useState<Cart>({});
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [pop, setPop] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate cart from localStorage, dropping slugs that left the menu
  useEffect(() => {
    try {
      const saved: Cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      Object.keys(saved).forEach((slug) => {
        if (!items.some((b) => b.slug === slug)) delete saved[slug];
      });
      setCart(saved);
    } catch { /* corrupted storage — start fresh */ }
    setLoaded(true);
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

  const add = (slug: string) => {
    setCart((c) => ({ ...c, [slug]: (c[slug] || 0) + 1 }));
    setPop(false);
    requestAnimationFrame(() => setPop(true));
    showToast(`${itemBySlug(slug).name} added to your order 🥞`);
  };

  const inc = (slug: string) => setCart((c) => ({ ...c, [slug]: c[slug] + 1 }));
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

  return (
    <>
      <main className="container">
        {!live && (
          <p className="ordering-paused" role="status">
            ⏸️ Online ordering is taking a quick break — please call us on{" "}
            <a href={telHref(restaurantPhone)}>{restaurantPhone}</a> to order. The menu below is still up to date.
          </p>
        )}
        <div className="menu-grid">
          {items.map((b, i) => (
            <article className="menu-card reveal" key={b.slug} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
              <div className="thumb">
                <img src={b.image} alt={`${b.name} pancakes`} loading="lazy" />
                <span className={`spice-tag ${heatClass(b.heat)}`}>{TAG_LABEL[b.tag]}</span>
              </div>
              <div className="body">
                <div className="row1">
                  <h3>{b.name}</h3>
                  <span className="price">${parseFloat(b.price)}</span>
                </div>
                <p className="desc">{b.description}</p>
                <div className="chips">
                  {b.kcal != null && <span className="chip">🔥 {b.kcal} kcal</span>}
                  {b.protein_g != null && <span className="chip">💪 {b.protein_g}g protein</span>}
                  {b.prep_time && <span className="chip">⏱ {b.prep_time}</span>}
                </div>
                {live && (
                  <button className="btn btn-primary" onClick={() => add(b.slug)}>
                    Add to Order +
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      {live && (
        <button className="cart-fab" aria-label="Open cart" onClick={() => setOpen(true)}>
          <ShoppingCart size={26} strokeWidth={2.2} aria-hidden="true" />
          <span className={`count${pop ? " pop" : ""}`}>{count}</span>
        </button>
      )}

      <div className={`cart-backdrop${open ? " show" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`cart-drawer${open ? " open" : ""}`} aria-label="Shopping cart">
        <div className="cart-head">
          <h3>Your Order</h3>
          <button className="cart-close" aria-label="Close cart" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="cart-items">
          {count === 0 ? (
            <p className="cart-empty">Your order is empty.<br />Go stack something. 🥞</p>
          ) : (
            Object.entries(cart).map(([slug, qty]) => {
              const b = itemBySlug(slug);
              return (
                <div className="cart-item" key={slug}>
                  <img src={b.image} alt={b.name} />
                  <div>
                    <div className="n">{b.name}</div>
                    <div className="p">${parseFloat(b.price)} × {qty} = ${(priceOf(slug) * qty).toFixed(2)}</div>
                  </div>
                  <div className="qty">
                    <button aria-label="Remove one" onClick={() => dec(slug)}>−</button>
                    <span>{qty}</span>
                    <button aria-label="Add one" onClick={() => inc(slug)}>+</button>
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
          <button className="btn btn-primary" onClick={checkout} disabled={placing}>
            {placing ? "Placing order…" : "Checkout →"}
          </button>
        </div>
      </aside>

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
