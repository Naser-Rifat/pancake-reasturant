"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getOrder, money, type ApiOrder } from "@/lib/api";
import { useCart } from "@/lib/cart";

const POLL_MS = 2500;
const MAX_POLLS = 12; // ~30s — Stripe's webhook normally lands within seconds

type Phase = "checking" | "paid" | "slow" | "missing";

export default function OrderSuccessClient({ publicId }: { publicId: string }) {
  // The cart lives in a provider now, not in localStorage this page can poke:
  // clearing the key alone left the header's cart badge still showing the items
  // the customer had just paid for.
  const { clear, setCouponCode } = useCart();
  const [phase, setPhase] = useState<Phase>(publicId ? "checking" : "missing");
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const polls = useRef(0);

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const found = await getOrder(publicId);
      if (cancelled) return;
      polls.current += 1;
      if (found) setOrder(found);
      if (found?.payment_status === "paid") {
        setPhase("paid");
        // payment confirmed — the cart is done, and so is the coupon: leaving
        // the code behind would silently re-apply it to the next order
        clear();
        setCouponCode("");
        return;
      }
      if (polls.current >= MAX_POLLS) {
        setPhase(found ? "slow" : "missing");
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [publicId, clear, setCouponCode]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          {phase === "paid" ? (
            <>
              <h1>
                Order <span className="accent">confirmed.</span>
              </h1>
              <p>Payment received — the kitchen has your order! 🥞</p>
            </>
          ) : phase === "checking" ? (
            <>
              <h1>
                One <span className="accent">moment…</span>
              </h1>
              <p>Confirming your payment with Stripe.</p>
            </>
          ) : (
            <>
              <h1>
                Almost <span className="accent">there.</span>
              </h1>
              <p>
                {phase === "slow"
                  ? "Your payment is taking a little longer to confirm — if your card was charged, your order is safe and we'll email you shortly."
                  : "We couldn't find that order. If your card was charged, please call us and we'll sort it out."}
              </p>
            </>
          )}
        </div>
      </section>

      <main className="container" style={{ maxWidth: 560, paddingBlock: "2.5rem" }}>
        {order && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ marginBottom: "0.75rem" }}>
              {order.customer_name ? `${order.customer_name}'s order` : "Your order"}
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {order.items.map((it) => (
                <li
                  key={it.slug}
                  style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}
                >
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span>{money(it.line_total)}</span>
                </li>
              ))}
            </ul>
            {parseFloat(order.discount_amount || "0") > 0 && (
              <>
                <div
                  style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}
                >
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                {/* without this line the items add up to more than the total and
                    the customer has no idea why */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}
                >
                  <span>{order.coupon_code || "Discount"}</span>
                  <span>&minus;{money(order.discount_amount)}</span>
                </div>
              </>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "2px solid currentColor",
                marginTop: "0.5rem",
                paddingTop: "0.5rem",
                fontWeight: 700,
              }}
            >
              <span>Total (incl. GST)</span>
              <span>{money(order.total)}</span>
            </div>
            {phase === "paid" && (
              <p style={{ marginTop: "1rem" }}>
                We&rsquo;ll email you the moment it&rsquo;s ready to collect.
              </p>
            )}
          </div>
        )}
        <Link href="/menu" className="btn btn-primary">
          Back to the menu →
        </Link>
      </main>
    </>
  );
}
