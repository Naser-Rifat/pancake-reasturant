"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  TAG_LABEL,
  money,
  placeOrder,
  telHref,
  type ApiMenuItem,
} from "@/lib/api";

const CART_KEY = "krush-cart-v2";
const TAG_ORDER = ["sweet", "savoury", "choc"] as const;

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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate cart from localStorage, dropping slugs that left the menu
  useEffect(() => {
    try {
      const saved: Cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      Object.keys(saved).forEach((slug) => {
        if (!items.some((b) => b.slug === slug)) delete saved[slug];
      });
      // deep link from a dish page: /menu?add=slug drops it straight in the
      // cart. Merged into `saved` and persisted BEFORE setCart so dev-mode
      // double-invocation (which re-reads storage) can't wipe it.
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
    } catch { /* corrupted storage — start fresh */ }
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
          <div className="ordering-paused" role="status" style={{ padding: "1.2rem", borderRadius: "12px", background: "rgba(224, 134, 0, 0.12)", border: "1px solid rgba(224, 134, 0, 0.3)", marginBottom: "2rem" }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {pauseMessage || "Online ordering is temporarily paused."} Call us on{" "}
              <a href={telHref(restaurantPhone)} style={{ textDecoration: "underline", fontWeight: 700 }}>{restaurantPhone}</a> to place an order.
            </p>
            {uberEatsUrl && (
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem" }}>
                Delivery is also available on{" "}
                <a href={uberEatsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#06C167", fontWeight: 700, textDecoration: "underline" }}>
                  Uber Eats 🛵
                </a>
              </p>
            )}
          </div>
        )}
        <div className="menu-grid">
          {TAG_ORDER.map((tag) => {
            const group = items.filter((b) => b.tag === tag);
            if (group.length === 0) return null;
            return (
              <section className="menu-cat-block" key={tag}>
                <h2 className="menu-cat">{TAG_LABEL[tag]}</h2>
                {group.map((b) => (
                  <article className="menu-card reveal" key={b.slug}>
                    <div className="thumb">
                      {/* fall back to the photo; src="" makes the browser refetch the page */}
                      {(b.image || b.photo) && (
                        <Image src={b.image || b.photo} alt={`${b.name} pancakes`} width={200} height={200} sizes="80px" />
                      )}
                    </div>
                    <div className="body">
                      <div className="row1">
                        <h3><Link href={`/menu/${b.slug}`}>{b.name}</Link></h3>
                        <span className="lead" aria-hidden="true" />
                        <span className="price">{money(b.price)}</span>
                      </div>
                      <p className="desc">{b.description}</p>
                      <div className="chips">
                        {b.kcal != null && <span className="chip">🔥 {b.kcal} kcal</span>}
                        {b.protein_g != null && <span className="chip">💪 {b.protein_g}g protein</span>}
                        {b.prep_time && <span className="chip">⏱ {b.prep_time}</span>}
                      </div>
                    </div>
                    {live && (
                      <button className="btn btn-primary" onClick={() => add(b.slug)}>
                        Add to Order
                      </button>
                    )}
                  </article>
                ))}
              </section>
            );
          })}
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
                  <Image src={b.image} alt={b.name} width={58} height={58} />
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
