"use client";

// The order drawer, lifted out of MenuClient so it is reachable from anywhere.
// It used to be the menu page's private markup and private `open` state, which
// is why the dish page had an "Add to Order" button and no way to see the
// order it had just added to. It now mounts once in the site layout and any
// cart button opens it through the shared provider.
//
// Behaviour is unchanged from the version that lived in MenuClient: same
// fields, same totals, same placeOrder call, same toasts.

import { useState } from "react";
import Image from "next/image";
import { money, placeOrder, type ApiMenuItem } from "@/lib/api";
import { useCart } from "@/lib/cart";

export default function CartDrawer({
  items,
  live = true,
  uberEatsUrl = "",
}: {
  items: ApiMenuItem[];
  live?: boolean;
  uberEatsUrl?: string;
}) {
  const { cart, count, inc, dec, clear, showToast, open, closeCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);

  // A slug can outlive its menu item between a stale cart and a fresh menu —
  // MenuClient reconciles on the menu page, but the drawer now renders on every
  // page, so it skips what it cannot price instead of throwing.
  const itemBySlug = (slug: string) => items.find((b) => b.slug === slug);
  const linesInCart = Object.entries(cart).flatMap(([slug, qty]) => {
    const item = itemBySlug(slug);
    return item ? [{ slug, qty, item }] : [];
  });

  const total = linesInCart.reduce((s, l) => s + parseFloat(l.item.price) * l.qty, 0);

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
      closeCart();
      showToast(`Order received — $${order.total}. See you soon, ${name.trim()}! 🎉`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div className={`cart-backdrop${open ? " show" : ""}`} onClick={closeCart} />

      <aside className={`cart-drawer${open ? " open" : ""}`} aria-label="Shopping cart">
        <div className="cart-head">
          <h3>Your Order</h3>
          <button className="cart-close" aria-label="Close cart" onClick={closeCart}>
            ✕
          </button>
        </div>

        <div className="cart-items">
          {linesInCart.length === 0 ? (
            <p className="cart-empty">
              Your order is empty.
              <br />
              Go stack something. 🥞
            </p>
          ) : (
            linesInCart.map(({ slug, qty, item }) => (
              <div className="cart-item" key={slug}>
                <Image src={item.image || item.photo} alt={item.name} width={58} height={58} />
                <div>
                  <div className="n">{item.name}</div>
                  <div className="p">
                    {money(item.price)} × {qty} = ${(parseFloat(item.price) * qty).toFixed(2)}
                  </div>
                </div>
                <div className="qty">
                  <button aria-label="Remove one" onClick={() => dec(slug)}>
                    −
                  </button>
                  <span>{qty}</span>
                  <button aria-label="Add one" onClick={() => inc(slug)}>
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-foot">
          {live ? (
            <>
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
                {placing ? "Placing order…" : "Checkout for Pickup →"}
              </button>
            </>
          ) : (
            <>
              <div className="cart-total">
                <span>Total</span>
                <b>${total.toFixed(2)}</b>
              </div>
              <p className="cart-empty" style={{ margin: "0 0 0.7rem" }}>
                Online ordering is paused right now — give us a call and we&apos;ll sort it.
              </p>
            </>
          )}

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
    </>
  );
}
