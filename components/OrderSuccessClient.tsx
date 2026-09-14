"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrder, money, type ApiOrder } from "@/lib/api";
import { useCart } from "@/lib/cart";

// Polling constants preserved for when Stripe webhook is re-enabled:
// const POLL_MS = 2500;
// const MAX_POLLS = 12;

type Phase = "checking" | "confirmed" | "paid" | "slow" | "missing";

function formatOrderTimes(createdAt?: string) {
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  const date = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  
  const placedTime = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const pickupStart = new Date(date.getTime() + 15 * 60 * 1000);
  const pickupEnd = new Date(date.getTime() + 20 * 60 * 1000);
  
  const startStr = pickupStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endStr = pickupEnd.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  
  return {
    placedTime,
    targetPickupTime: `${startStr} – ${endStr}`,
  };
}

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

  const times = formatOrderTimes(order?.created_at);

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

      <main className="container" style={{ maxWidth: 580, paddingBlock: "2rem" }}>
        {order && (
          <div style={{ marginBottom: "2.5rem" }}>
            {/* Apple-Style Live ETA Hero Card */}
            <div className="order-eta-card">
              <div className="order-eta-badge">
                <span className="order-pulse-dot" />
                <span>🍳 Griddling Fresh in the Kitchen</span>
              </div>

              <div className="order-eta-hero">
                <div className="order-eta-label">Estimated Ready for Pickup</div>
                <div className="order-eta-time">{times.targetPickupTime}</div>
                <div className="order-eta-meta">
                  Order placed at <b>{times.placedTime}</b> · Standard prep: 15–20 mins
                </div>
              </div>

              {/* 3-Stage Visual Stepper */}
              <div className="order-stepper">
                <div className="step completed">
                  <div className="step-dot">✓</div>
                  <div className="step-label">Placed</div>
                </div>
                <div className="step-line active" />
                <div className="step active">
                  <div className="step-dot">
                    <span className="step-pulse" />
                    🥞
                  </div>
                  <div className="step-label">Baking</div>
                </div>
                <div className="step-line" />
                <div className="step upcoming">
                  <div className="step-dot">🛍️</div>
                  <div className="step-label">Pickup</div>
                </div>
              </div>

              {/* Pickup Counter Callout */}
              <div className="order-pickup-instruction">
                <div className="order-pickup-row">
                  <span className="loc-icon">📍</span>
                  <div>
                    <div className="order-pickup-title">Collect & Pay at Counter</div>
                    <div className="order-pickup-sub">
                      Quote name <b>{order.customer_name || "Guest"}</b> or Order <b>#{order.public_id.slice(-6).toUpperCase()}</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: "1.25rem", margin: "2rem 0 1rem" }}>
              Order Receipt
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
