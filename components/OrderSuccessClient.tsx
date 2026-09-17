"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, MessageCircle, Printer, PlusCircle } from "lucide-react";
import { getOrder, money, type ApiOrder, type ApiSiteSettings } from "@/lib/api";
import { useCart } from "@/lib/cart";

interface OrderSuccessClientProps {
  publicId: string;
  site?: ApiSiteSettings;
}

function formatOrderTimes(createdAt?: string, prepDurationStr?: string) {
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  const date = isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const placedTime = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Default to 15-20 mins
  let minMinutes = 15;
  let maxMinutes = 20;

  if (prepDurationStr) {
    const match = prepDurationStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (match) {
      minMinutes = parseInt(match[1], 10) || 15;
      maxMinutes = parseInt(match[2], 10) || 20;
    } else {
      const single = parseInt(prepDurationStr, 10);
      if (single) {
        minMinutes = single;
        maxMinutes = single + 5;
      }
    }
  }

  const pickupStart = new Date(date.getTime() + minMinutes * 60 * 1000);
  const pickupEnd = new Date(date.getTime() + maxMinutes * 60 * 1000);

  const startStr = pickupStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endStr = pickupEnd.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return {
    placedTime,
    targetPickupTime: `${startStr} – ${endStr}`,
    prepWindow: `${minMinutes}–${maxMinutes} mins`,
    pickupStartDate: pickupStart,
    pickupEndDate: pickupEnd,
  };
}

// Simple floating confetti animation
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ["#efbf38", "#e08600", "#763a12", "#b382d6", "#f26d85", "#10b981", "#3b82f6"];
    const pieces: {
      x: number;
      y: number;
      size: number;
      color: string;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpeed: number;
    }[] = [];

    for (let i = 0; i < 45; i++) {
      pieces.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.5) - height * 0.2,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 2.5 + 1.2,
        speedX: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
      });
    }

    let animationId: number;
    let startTime = Date.now();

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      const elapsed = Date.now() - startTime;
      // Fade out after 4.5 seconds
      const globalAlpha = Math.max(0, 1 - elapsed / 5000);
      ctx.globalAlpha = globalAlpha;

      if (globalAlpha > 0) {
        pieces.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();

          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += p.rotSpeed;
        });

        animationId = requestAnimationFrame(render);
      }
    }

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}

export default function OrderSuccessClient({
  publicId,
  site,
}: OrderSuccessClientProps) {
  const { clear, setCouponCode } = useCart();
  const orderQuery = useQuery({
    queryKey: ["order", publicId],
    queryFn: () => getOrder(publicId),
    enabled: Boolean(publicId),
    refetchInterval: 4_000,
    staleTime: 0,
  });
  const order = orderQuery.data ?? null;
  const loading = Boolean(publicId) && orderQuery.isPending;
  const [copied, setCopied] = useState(false);
  const [manualId, setManualId] = useState("");

  const venueAddress = site?.address || "133 Ryrie St, Geelong VIC 3220";
  const venuePhone = site?.phone || "0499 123 456";
  const venueWhatsapp = site?.whatsapp || "";
  const venueInstagram = site?.instagram_url || "https://instagram.com";

  // Clear cart immediately upon mounting order confirmation
  useEffect(() => {
    clear();
    setCouponCode("");
  }, [clear, setCouponCode]);

  const times = formatOrderTimes(order?.created_at, site?.order_prep_time);

  const copyOrderId = () => {
    if (!order) return;
    const formattedId = `TPC-${order.public_id.slice(-6).toUpperCase()}`;
    navigator.clipboard.writeText(formattedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `The Pancake Club, ${venueAddress}`
  )}`;

  // Calculate GST (Australian 10% included)
  const totalNum = order ? parseFloat(order.total || "0") : 0;
  const gstAmount = (totalNum / 11).toFixed(2);

  // Stepper state calculation
  // Status values: received, preparing, ready, completed, cancelled
  const orderStatus = order?.status?.toLowerCase() || "received";
  const isCancelled = orderStatus === "cancelled";
  const isCompleted = orderStatus === "completed";
  const isReady = orderStatus === "ready";
  const isPreparing = orderStatus === "preparing";
  const isReceived = orderStatus === "received" || orderStatus === "pending_payment";

  let activeStepIndex = 1; // 1: Placed, 2: Preparing, 3: Ready, 4: Completed
  if (isReceived) activeStepIndex = 1;
  else if (isPreparing) activeStepIndex = 2;
  else if (isReady) activeStepIndex = 3;
  else if (isCompleted) activeStepIndex = 4;

  return (
    <>
      <ConfettiCanvas />

      {/* Page Hero */}
      <section className="page-hero order-success-hero">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="order-hero-pill-badge">
            <span className="order-hero-badge-dot" />
            <span>🥞 Freshly Griddled to Order</span>
          </div>

          <h1 className="order-success-title">
            {order ? (
              <>
                Order <span className="accent">Received!</span>
              </>
            ) : loading ? (
              <>
                Checking <span className="accent">Order…</span>
              </>
            ) : (
              <>
                Order <span className="accent">Lookup</span>
              </>
            )}
          </h1>

          <p className="order-success-sub">
            {order ? (
              <>
                Thank you <b>{order.customer_name || "there"}</b>! The kitchen has received your ticket and will griddle it fresh.
              </>
            ) : loading ? (
              "Retrieving the latest updates directly from our kitchen…"
            ) : (
              "Enter your Order ID below to view your real-time status and pickup receipt."
            )}
          </p>
        </div>
      </section>

      <main className="container order-success-container">
        {order ? (
          <div className="order-success-grid">
            {/* Left Column: Live Status & Pickup Info */}
            <div className="order-status-column">
              {/* Order Reference Card */}
              <div className="order-ref-card">
                <div className="order-ref-left">
                  <div className="order-ref-label">Order Reference</div>
                  <div className="order-ref-number">
                    #TPC-{order.public_id.slice(-6).toUpperCase()}
                  </div>
                </div>
                <button
                  type="button"
                  className={`order-copy-btn ${copied ? "copied" : ""}`}
                  onClick={copyOrderId}
                  aria-label="Copy order reference"
                >
                  {copied ? (
                    <>
                      <span className="icon">✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span className="icon">📋</span>
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Kitchen Status Card */}
              <div className={`order-live-card ${isReady ? "ready-glow" : ""}`}>
                <div className="order-live-header">
                  <div className="order-live-badge">
                    <span
                      className={`order-pulse-dot ${
                        isCancelled ? "cancelled" : isReady || isCompleted ? "green" : "amber"
                      }`}
                    />
                    <span>
                      {isCancelled
                        ? "Order Cancelled"
                        : isCompleted
                        ? "Order Collected"
                        : isReady
                        ? "🛎️ Ready for Pickup!"
                        : isPreparing
                        ? "🍳 Sizzling on the Griddle"
                        : "📋 Received in Kitchen"}
                    </span>
                  </div>

                  <span className="order-placed-time">Placed at {times.placedTime}</span>
                </div>

                {/* Estimated Ready Window */}
                {!isCancelled && !isCompleted && (
                  <div className="order-eta-section">
                    <div className="order-eta-kicker">
                      {isReady ? "Collect Now at Front Counter" : "Estimated Ready Window"}
                    </div>
                    <div className={`order-eta-clock-hero ${isReady ? "ready" : ""}`}>
                      {isReady ? "Ready Now!" : times.targetPickupTime}
                    </div>
                    <div className="order-eta-subtext">
                      {isReady ? (
                        <span>✨ Your warm pancakes are packed and waiting at the counter.</span>
                      ) : (
                        <span>
                          Standard prep time is <b>{times.prepWindow}</b>. Griddled fresh from scratch!
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 4-Step Visual Kitchen Stepper */}
                {!isCancelled && (
                  <div className="order-flow-stepper">
                    {/* Step 1: Placed */}
                    <div className={`flow-step ${activeStepIndex >= 1 ? "completed" : "pending"}`}>
                      <div className="flow-step-circle">
                        {activeStepIndex > 1 ? "✓" : "📋"}
                      </div>
                      <div className="flow-step-name">Placed</div>
                      <div className="flow-step-time">{times.placedTime}</div>
                    </div>

                    <div className={`flow-step-line ${activeStepIndex >= 2 ? "active" : ""}`} />

                    {/* Step 2: Preparing */}
                    <div
                      className={`flow-step ${
                        activeStepIndex > 2 ? "completed" : activeStepIndex === 2 ? "active" : "pending"
                      }`}
                    >
                      <div className="flow-step-circle">
                        {activeStepIndex > 2 ? "✓" : "🥞"}
                      </div>
                      <div className="flow-step-name">Griddling</div>
                      <div className="flow-step-time">{activeStepIndex >= 2 ? "In Kitchen" : "Next"}</div>
                    </div>

                    <div className={`flow-step-line ${activeStepIndex >= 3 ? "active" : ""}`} />

                    {/* Step 3: Ready */}
                    <div
                      className={`flow-step ${
                        activeStepIndex > 3 ? "completed" : activeStepIndex === 3 ? "active" : "pending"
                      }`}
                    >
                      <div className="flow-step-circle">
                        {activeStepIndex > 3 ? "✓" : "🛎️"}
                      </div>
                      <div className="flow-step-name">Ready</div>
                      <div className="flow-step-time">Counter</div>
                    </div>

                    <div className={`flow-step-line ${activeStepIndex >= 4 ? "active" : ""}`} />

                    {/* Step 4: Enjoy */}
                    <div className={`flow-step ${activeStepIndex >= 4 ? "completed" : "pending"}`}>
                      <div className="flow-step-circle">
                        {activeStepIndex >= 4 ? "✓" : "😋"}
                      </div>
                      <div className="flow-step-name">Enjoy</div>
                      <div className="flow-step-time">Stack Up!</div>
                    </div>
                  </div>
                )}

                {/* Cancellation notice if cancelled */}
                {isCancelled && (
                  <div className="order-cancelled-box">
                    <p>
                      <b>This order was cancelled.</b>
                      {order.cancel_reason && ` Reason: ${order.cancel_reason}`}
                    </p>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                      Please give our staff a call on <a href={`tel:${venuePhone}`}>{venuePhone}</a> if you have any questions.
                    </p>
                  </div>
                )}
              </div>

              {/* Pickup Counter Location & Quick Actions */}
              <div className="order-pickup-card">
                <div className="pickup-card-head">
                  <div className="pickup-icon-bubble">📍</div>
                  <div>
                    <h3 className="pickup-card-title">Pickup & Collection Counter</h3>
                    <p className="pickup-card-address">{venueAddress}</p>
                  </div>
                </div>

                <div className="pickup-instruction-pill">
                  <span className="pill-icon">💡</span>
                  <span>
                    When you arrive, quote your name <b>{order.customer_name || "Guest"}</b> or Order <b>#TPC-{order.public_id.slice(-6).toUpperCase()}</b>.
                  </span>
                </div>

                <div className="pickup-actions-grid">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pickup-action-btn"
                  >
                    <MapPin size={15} className="action-icon" aria-hidden="true" />
                    <span>Get Directions</span>
                  </a>

                  <a href={`tel:${venuePhone.replace(/[^+\d]/g, "")}`} className="pickup-action-btn">
                    <Phone size={15} className="action-icon" aria-hidden="true" />
                    <span>Call Kitchen</span>
                  </a>

                  {venueWhatsapp && (
                    <a
                      href={`https://wa.me/${venueWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi The Pancake Club! I'm checking on my pickup order #TPC-${order.public_id.slice(-6).toUpperCase()}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pickup-action-btn whatsapp"
                    >
                      <MessageCircle size={15} className="action-icon" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Engagement & While-You-Wait Card */}
              <div className="while-you-wait-card">
                <div className="wait-card-header">
                  <span className="wait-emoji">☕</span>
                  <h4>While You Wait</h4>
                </div>
                <p className="wait-card-text">
                  Craving our signature iced maple latte, thickshakes, or extra maple syrup? Just ask our counter team when you arrive!
                </p>
                <div className="wait-card-links">
                  <a
                    href={venueInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wait-link"
                  >
                    <span>📸</span> Tag us on Instagram
                  </a>
                  <span className="dot-sep">·</span>
                  <Link href="/book" className="wait-link">
                    <span>📅</span> Book a Table for Next Time
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Itemized Diner Receipt */}
            <div className="order-receipt-column">
              <div className="order-receipt-paper">
                <div className="receipt-header">
                  <div className="receipt-logo">THE PANCAKE CLUB</div>
                  <div className="receipt-sub">133 Ryrie St, Geelong · Australia</div>
                  <div className="receipt-divider" />
                  <div className="receipt-meta-row">
                    <span>Customer: <b>{order.customer_name}</b></span>
                    <span>{new Date(order.created_at || Date.now()).toLocaleDateString("en-AU")}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span>Order: <b>#TPC-{order.public_id.slice(-6).toUpperCase()}</b></span>
                    <span>{times.placedTime}</span>
                  </div>
                </div>

                <div className="receipt-divider dashed" />

                {/* Items List */}
                <div className="receipt-items-list">
                  {order.items.map((item, idx) => (
                    <div className="receipt-item-row" key={`${item.slug}-${idx}`}>
                      <div className="receipt-item-left">
                        <div className="receipt-item-thumb-wrap">
                          <Image
                            src={item.photo || item.image || "/menu/buttermilk.png"}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="receipt-item-thumb"
                          />
                        </div>
                        <div className="receipt-item-info">
                          <div className="receipt-item-name">{item.name}</div>
                          <div className="receipt-item-calc">
                            {item.quantity} × {money(item.unit_price)}
                          </div>
                        </div>
                      </div>
                      <div className="receipt-item-total">{money(item.line_total)}</div>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider dashed" />

                {/* Financial Summary */}
                <div className="receipt-totals">
                  <div className="receipt-row">
                    <span>Subtotal</span>
                    <span>{money(order.subtotal)}</span>
                  </div>

                  {parseFloat(order.discount_amount || "0") > 0 && (
                    <div className="receipt-row discount">
                      <span className="coupon-chip">
                        🏷️ {order.coupon_code || "Discount"}
                      </span>
                      <span>&minus;{money(order.discount_amount)}</span>
                    </div>
                  )}

                  <div className="receipt-row muted">
                    <span>Includes 10% Australian GST</span>
                    <span>${gstAmount}</span>
                  </div>

                  <div className="receipt-divider" />

                  <div className="receipt-row grand-total">
                    <span>Total Amount</span>
                    <span className="total-val">{money(order.total)}</span>
                  </div>
                </div>

                {/* Payment Method Badge */}
                <div className={`receipt-payment-badge ${order.payment_status === "paid" ? "paid" : "unpaid"}`}>
                  {order.payment_status === "paid" ? (
                    <>
                      <span className="badge-icon">✅</span>
                      <div>
                        <b>Paid Online (Stripe)</b>
                        <div className="badge-sub">Card payment confirmed</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="badge-icon">💳</span>
                      <div>
                        <b>Pay at Counter on Collection</b>
                        <div className="badge-sub">Cash, EFTPOS & Tap-to-Pay accepted</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Print & Action Bar */}
                <div className="receipt-actions no-print">
                  <button type="button" className="receipt-btn receipt-btn-outline" onClick={handlePrint}>
                    <Printer size={16} aria-hidden="true" />
                    <span>Print / Save PDF</span>
                  </button>
                  <Link href="/menu" className="receipt-btn receipt-btn-primary">
                    <PlusCircle size={16} aria-hidden="true" />
                    <span>Order More</span>
                  </Link>
                </div>
                <div className="receipt-download-hint no-print">
                  💡 Select <b>&ldquo;Save as PDF&rdquo;</b> in print dialog to download
                </div>

                <div className="receipt-footer-wrap">
                  <div className="receipt-footer-badge">
                    <span>🥞</span>
                    <span>Freshly Griddled · Geelong West</span>
                  </div>
                  <div className="receipt-footer-text">
                    Thank you for dining with The Pancake Club!
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Missing or Custom Lookup Screen */
          <div className="order-not-found-card">
            <div className="not-found-icon">🥞❓</div>
            <h2>Order Lookup</h2>
            <p>
              We couldn&apos;t find an active order with that reference. If you recently placed an order, please enter your Order ID or phone number below.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualId.trim()) {
                  window.location.assign(`/order/success?order=${encodeURIComponent(manualId.trim())}`);
                }
              }}
              className="order-lookup-form"
            >
              <input
                type="text"
                className="input"
                placeholder="e.g. TPC-A1B2C3 or order UUID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search Order →
              </button>
            </form>

            <div className="order-not-found-footer">
              <p>Need urgent assistance with your stack?</p>
              <a href={`tel:${venuePhone.replace(/[^+\d]/g, "")}`} className="btn btn-outline">
                📞 Call {venuePhone}
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
