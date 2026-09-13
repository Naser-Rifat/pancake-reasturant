"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrder, money, type ApiOrder } from "@/lib/api";
import { useCart } from "@/lib/cart";

// Polling constants preserved for when Stripe webhook is re-enabled:
// const POLL_MS = 2500;
// const MAX_POLLS = 12;

type Phase = "checking" | "confirmed" | "paid" | "slow" | "missing";

export default function OrderSuccessClient({ publicId }: { publicId: string }) {
  // Clear cart and coupon when order is confirmed
  const { clear, setCouponCode } = useCart();
  const [phase, setPhase] = useState<Phase>(publicId ? "checking" : "missing");
  const [order, setOrder] = useState<ApiOrder | null>(null);

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;

    // Immediately clear cart on order completion
    clear();
    setCouponCode("");

    const loadOrder = async () => {
      const found = await getOrder(publicId);
      if (cancelled) return;
      if (found) {
        setOrder(found);
        setPhase("confirmed");
      } else {
        setPhase("missing");
      }
    };

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [publicId, clear, setCouponCode]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          {phase === "confirmed" || phase === "paid" ? (
            <>
              <h1>
                Order <span className="accent">confirmed.</span>
              </h1>
              <p>The kitchen has your order! Please pay at the counter when you collect. 🥞</p>
            </>
          ) : phase === "checking" ? (
            <>
              <h1>
                One <span className="accent">moment…</span>
              </h1>
              <p>Retrieving your order details…</p>
            </>
          ) : (
            <>
              <h1>
                Order <span className="accent">lookup.</span>
              </h1>
              <p>
                We couldn&apos;t find that order. Please give us a call and we&apos;ll sort it out.
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
            {(phase === "confirmed" || phase === "paid") && (
              <p style={{ marginTop: "1rem" }}>
                We&rsquo;ll email you the moment it&rsquo;s ready to collect. Pay at the counter when you pick up!
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
