"use client";

// The order drawer, lifted out of MenuClient so it is reachable from anywhere.
// It used to be the menu page's private markup and private `open` state, which
// is why the dish page had an "Add to Order" button and no way to see the
// order it had just added to. It now mounts once in the site layout and any
// cart button opens it through the shared provider.
//
// Checkout hands off to Stripe: placeOrder creates the order unpaid and returns
// a Checkout URL, and the cart is deliberately NOT cleared here — /order/success
// clears it once the webhook confirms payment, so a customer who backs out of
// Stripe comes back with their order intact.

import { useEffect, useState } from "react";
import Image from "next/image";
import { money, placeOrder, validateCoupon, type ApiCouponPreview, type ApiMenuItem } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { validatePhoneNumber } from "@/lib/format";

export default function CartDrawer({
  items,
  live = true,
  uberEatsUrl = "",
}: {
  items: ApiMenuItem[];
  live?: boolean;
  uberEatsUrl?: string;
}) {
  const { cart, count, inc, dec, showToast, open, closeCart, couponCode, setCouponCode } =
    useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [placing, setPlacing] = useState(false);
  // the box starts closed: an empty coupon field in front of every customer
  // sends the ones without a code off to hunt for one, and they don't come back
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponDraft, setCouponDraft] = useState("");
  const [coupon, setCoupon] = useState<ApiCouponPreview | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // A slug can outlive its menu item between a stale cart and a fresh menu —
  // MenuClient reconciles on the menu page, but the drawer now renders on every
  // page, so it skips what it cannot price instead of throwing.
  const itemBySlug = (slug: string) => items.find((b) => b.slug === slug);
  const linesInCart = Object.entries(cart).flatMap(([slug, qty]) => {
    const item = itemBySlug(slug);
    return item ? [{ slug, qty, item }] : [];
  });

  const subtotal = linesInCart.reduce((s, l) => s + parseFloat(l.item.price) * l.qty, 0);
  const discount = coupon ? parseFloat(coupon.discount) : 0;
  const total = subtotal - discount;

  const cartLines = Object.entries(cart).map(([slug, quantity]) => ({ slug, quantity }));
  const cartKey = JSON.stringify(cartLines);

  // Re-price on every cart change, not just on apply: a code with a $30 minimum
  // must fall away the moment the cart drops below it, and the number beside
  // "Total" has to be the number Stripe will charge.
  useEffect(() => {
    if (!couponCode || !count) {
      setCoupon(null);
      setCouponError("");
      return;
    }
    let cancelled = false;
    setCheckingCoupon(true);
    validateCoupon(couponCode, JSON.parse(cartKey))
      .then((preview) => {
        if (cancelled) return;
        setCoupon(preview);
        setCouponError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setCoupon(null);
        setCouponError(err instanceof Error ? err.message : "That code isn't valid.");
      })
      .finally(() => {
        if (!cancelled) setCheckingCoupon(false);
      });
    return () => {
      cancelled = true;
    };
  }, [couponCode, cartKey, count]);

  // a code carried in on a campaign link should show itself, not hide behind
  // "Have a coupon?" as though the customer had done nothing
  useEffect(() => {
    if (couponCode) setCouponOpen(true);
  }, [couponCode]);

  const applyCoupon = () => {
    const code = couponDraft.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setCheckingCoupon(true);
    validateCoupon(code, JSON.parse(cartKey))
      .then((preview) => {
        setCoupon(preview);
        setCouponCode(code);
        setCouponDraft("");
        setCouponError("");
      })
      .catch((err) => {
        setCoupon(null);
        setCouponError(err instanceof Error ? err.message : "That code isn't valid.");
      })
      .finally(() => {
        setCheckingCoupon(false);
      });
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCoupon(null);
    setCouponError("");
  };

  const handlePhoneChange = (val: string) => {
    // Only allow phone characters: digits, leading +, spaces, hyphens, parens, dots
    const sanitized = val.replace(/[^\d+\s\-().]/g, "");
    setPhone(sanitized);
    if (phoneError) {
      const res = validatePhoneNumber(sanitized);
      if (res.isValid) setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (!phone.trim()) {
      setPhoneError("");
      return;
    }
    const res = validatePhoneNumber(phone);
    if (!res.isValid) {
      setPhoneError(res.error || "Please enter a valid phone number.");
    } else {
      setPhoneError("");
    }
  };

  const checkout = async () => {
    if (!count) return showToast("Your order is empty!");
    if (!name.trim()) return showToast("Add your name so we know whose stack it is!");

    if (phone.trim()) {
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.isValid) {
        const msg = phoneValidation.error || "Please enter a valid phone number.";
        setPhoneError(msg);
        return showToast(msg);
      }
    }

    setPlacing(true);
    try {
      const order = await placeOrder({
        customer_name: name.trim(),
        phone: phone.trim(),
        items: cartLines,
        // the code only — the server re-prices it and is the sole authority on
        // what Stripe charges
        ...(coupon ? { coupon_code: coupon.code } : {}),
      });
      if (!order.checkout_url) {
        throw new Error("Payments are unavailable right now — please try again or call us.");
      }
      // the cart stays in localStorage until /order/success confirms payment, so
      // cancelling on Stripe brings the customer back with nothing lost
      window.location.assign(order.checkout_url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setPlacing(false);
    }
    // no finally — the button stays busy through the redirect
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
                <div>
                  <input
                    className={`input${phoneError ? " error" : ""}`}
                    style={phoneError ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } : undefined}
                    placeholder="Phone (optional, e.g. 0412 345 678 or +61...)"
                    value={phone}
                    autoComplete="tel"
                    inputMode="tel"
                    aria-invalid={!!phoneError}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                  />
                  {phoneError && (
                    <p
                      className="cart-phone-error"
                      role="alert"
                      style={{
                        color: "#dc2626",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        paddingLeft: "0.25rem",
                      }}
                    >
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>
              {/* Closed by default. An open, empty coupon field in front of every
                  customer sends the ones without a code away to look for one. */}
              {!couponOpen ? (
                <button
                  type="button"
                  className="cart-coupon-toggle"
                  onClick={() => setCouponOpen(true)}
                >
                  Have a coupon?
                </button>
              ) : coupon ? (
                <div className="cart-coupon on">
                  <span className="cart-coupon-code">{coupon.code}</span>
                  <span className="cart-coupon-label">{coupon.label}</span>
                  <button
                    type="button"
                    className="cart-coupon-remove"
                    aria-label={`Remove coupon ${coupon.code}`}
                    onClick={removeCoupon}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="cart-coupon">
                  <input
                    className="input"
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    autoCapitalize="characters"
                    autoComplete="off"
                    style={{ textTransform: "uppercase" }}
                    value={couponDraft}
                    onChange={(e) => setCouponDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  />
                  <button
                    type="button"
                    className="cart-coupon-apply"
                    onClick={applyCoupon}
                    disabled={checkingCoupon || !couponDraft.trim()}
                  >
                    {checkingCoupon ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="cart-coupon-error" role="status">
                  {couponError}
                </p>
              )}

              {discount > 0 && coupon && (
                <>
                  <div className="cart-total muted">
                    <span>Subtotal</span>
                    <b>${subtotal.toFixed(2)}</b>
                  </div>
                  <div className="cart-total off">
                    <span>{coupon.code}</span>
                    <b>&minus;${discount.toFixed(2)}</b>
                  </div>
                </>
              )}
              <div className="cart-total">
                <span>Total</span>
                <b>${total.toFixed(2)}</b>
              </div>
              <button className="btn btn-primary" onClick={checkout} disabled={placing}>
                {placing ? "Taking you to payment…" : "Pay & place order →"}
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
