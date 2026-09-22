"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  MessageCircle,
  Printer,
  PlusCircle,
  Copy,
  Check,
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  Info,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Calendar,
  Tag,
  Search,
  Sparkles,
} from "lucide-react";
import { getOrder, money, type ApiOrder, type ApiSiteSettings } from "@/lib/api";
import { addressLocality, cleanAddress } from "@/lib/format";
import { formatOrderRef } from "@/lib/order-utils";
import { useCart } from "@/lib/cart";

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

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

/**
 * Triple-chevron directional arrow indicator matching user's reference (Image 2),
 * signaling progressive motion from one kitchen status to the next.
 */
function FlowTripleChevrons({
  status = "pending",
  label = "Next status",
}: {
  status?: "active" | "completed" | "pending";
  label?: string;
}) {
  return (
    <div className={`flow-triple-chevrons ${status}`} aria-label={label}>
      <svg className="flow-ch ch-1" viewBox="0 0 10 16" fill="none" aria-hidden="true">
        <path d="M2 2.5L7.5 8L2 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg className="flow-ch ch-2" viewBox="0 0 10 16" fill="none" aria-hidden="true">
        <path d="M2 2.5L7.5 8L2 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg className="flow-ch ch-3" viewBox="0 0 10 16" fill="none" aria-hidden="true">
        <path d="M2 2.5L7.5 8L2 13.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
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
  const orderError =
    orderQuery.error instanceof Error ? orderQuery.error.message : "";
  const [copied, setCopied] = useState(false);
  const [manualId, setManualId] = useState("");
  const [emailDeliveryFailed, setEmailDeliveryFailed] = useState(false);

  const venueAddress = site?.address || "";
  const venueDisplayAddress = cleanAddress(venueAddress);
  const venueLocality = addressLocality(venueAddress);
  const venuePhone = site?.phone || "0499 123 456";
  const venueWhatsapp = site?.whatsapp || "";
  const venueInstagram = site?.instagram_url || "https://instagram.com";

  // Clear cart immediately upon mounting order confirmation
  useEffect(() => {
    clear();
    setCouponCode("");
  }, [clear, setCouponCode]);

  useEffect(() => {
    if (!publicId) return;
    const key = `order-email-delivery:${publicId}`;
    setEmailDeliveryFailed(sessionStorage.getItem(key) === "failed");
  }, [publicId]);

  const times = formatOrderTimes(order?.created_at, site?.order_prep_time);

  const copyOrderId = () => {
    if (!order) return;
    const formattedId = formatOrderRef(order.public_id);
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
      {/* Page Hero */}
      <section className="page-hero order-success-hero">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="order-hero-pill-badge">
            <span className="order-hero-badge-dot" />
            <span>Order Confirmed · Kitchen Live</span>
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
                Thank you, <b>{order.customer_name || "Guest"}</b>. The kitchen has received your ticket and is preparing your order fresh.
              </>
            ) : loading ? (
              "Retrieving the latest updates directly from our kitchen…"
            ) : (
              "Enter your Order ID below to view your real-time status and pickup receipt."
            )}
          </p>
          {order && emailDeliveryFailed && (
            <p className="order-email-warning" role="alert">
              Your order is saved, but we couldn&apos;t send the confirmation email.
              Keep this page or your order reference, and call us if you need help.
            </p>
          )}
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
                    #{formatOrderRef(order.public_id)}
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
                      <Check size={14} className="icon" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="icon" aria-hidden="true" />
                      <span>Copy Ref</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Kitchen Status Card */}
              <div className={`order-live-card ${isReady ? "ready-glow" : ""}`}>
                <div className="order-live-header">
                  <div className={`order-live-badge ${isCancelled ? "cancelled" : isReady ? "ready" : ""}`}>
                    <span
                      className={`order-pulse-dot ${
                        isCancelled ? "cancelled" : isReady || isCompleted ? "green" : "amber"
                      }`}
                    />
                    <span>
                      {isCancelled ? (
                        <>Order Cancelled</>
                      ) : isCompleted ? (
                        <>Order Collected</>
                      ) : isReady ? (
                        <>Ready for Pickup</>
                      ) : isPreparing ? (
                        <>Preparing on Griddle</>
                      ) : (
                        <>Received in Kitchen</>
                      )}
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
                        <span>Your warm pancakes are packed and waiting at the counter.</span>
                      ) : (
                        <span>
                          Standard prep time is <b>{times.prepWindow}</b> · Griddled fresh from scratch.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 4-Step Visual Kitchen Stepper */}
                {!isCancelled && (
                  <div className="order-flow-stepper" aria-label="Order Progress Stepper">
                    {/* Step 1: Placed */}
                    <div className={`flow-step ${activeStepIndex >= 1 ? (activeStepIndex === 1 ? "active" : "completed") : "pending"}`}>
                      <div className="flow-step-circle">
                        {activeStepIndex > 1 ? (
                          <Check size={18} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <Clock size={18} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </div>
                      <div className="flow-step-name">Placed</div>
                      <div className="flow-step-time">{times.placedTime}</div>
                    </div>

                    {/* Connector 1 -> 2 */}
                    <div className="flow-step-line" aria-hidden="true">
                      <FlowTripleChevrons
                        status={activeStepIndex > 1 ? "completed" : activeStepIndex === 1 ? "active" : "pending"}
                        label="Moving to Griddling"
                      />
                    </div>

                    {/* Step 2: Preparing */}
                    <div
                      className={`flow-step ${
                        activeStepIndex > 2 ? "completed" : activeStepIndex === 2 ? "active" : "pending"
                      }`}
                    >
                      <div className="flow-step-circle">
                        {activeStepIndex > 2 ? (
                          <Check size={18} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <ChefHat size={18} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </div>
                      <div className="flow-step-name">Griddling</div>
                      <div className="flow-step-time">{activeStepIndex >= 2 ? "In Kitchen" : "Next"}</div>
                    </div>

                    {/* Connector 2 -> 3 */}
                    <div className="flow-step-line" aria-hidden="true">
                      <FlowTripleChevrons
                        status={activeStepIndex > 2 ? "completed" : activeStepIndex === 2 ? "active" : "pending"}
                        label="Moving to Ready"
                      />
                    </div>

                    {/* Step 3: Ready */}
                    <div
                      className={`flow-step ${
                        activeStepIndex > 3 ? "completed" : activeStepIndex === 3 ? "active" : "pending"
                      }`}
                    >
                      <div className="flow-step-circle">
                        {activeStepIndex > 3 ? (
                          <Check size={18} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <BellRing size={18} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </div>
                      <div className="flow-step-name">Ready</div>
                      <div className="flow-step-time">Counter</div>
                    </div>

                    {/* Connector 3 -> 4 */}
                    <div className="flow-step-line" aria-hidden="true">
                      <FlowTripleChevrons
                        status={activeStepIndex >= 4 ? "completed" : activeStepIndex === 3 ? "active" : "pending"}
                        label="Moving to Pickup"
                      />
                    </div>

                    {/* Step 4: Enjoy */}
                    <div className={`flow-step ${activeStepIndex >= 4 ? "completed active" : "pending"}`}>
                      <div className="flow-step-circle">
                        {activeStepIndex >= 4 ? (
                          <Check size={18} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <UtensilsCrossed size={18} strokeWidth={2.2} aria-hidden="true" />
                        )}
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
                  <div className="pickup-icon-bubble">
                    <MapPin size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="pickup-card-title">Pickup & Collection Counter</h3>
                    {venueAddress && <p className="pickup-card-address">{venueAddress}</p>}
                  </div>
                </div>

                <div className="pickup-instruction-pill">
                  <Info size={16} className="pill-icon" aria-hidden="true" />
                  <span>
                    When you arrive, quote your name <b>{order.customer_name || "Guest"}</b> or Order <b>#{formatOrderRef(order.public_id)}</b>.
                  </span>
                </div>

                <div className="pickup-actions-grid">
                  {venueAddress && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pickup-action-btn"
                    >
                      <MapPin size={15} className="action-icon" aria-hidden="true" />
                      <span>Get Directions</span>
                    </a>
                  )}

                  <a href={`tel:${venuePhone.replace(/[^+\d]/g, "")}`} className="pickup-action-btn">
                    <Phone size={15} className="action-icon" aria-hidden="true" />
                    <span>Call Kitchen</span>
                  </a>

                  {venueWhatsapp && (
                    <a
                      href={`https://wa.me/${venueWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi The Pancake Club! I'm checking on my pickup order #${formatOrderRef(order.public_id)}`
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

              {/* Engagement & Counter Hospitality Note */}
              <div className="while-you-wait-card">
                <div className="wait-card-header">
                  <Coffee size={16} aria-hidden="true" />
                  <h4>Hospitality & Counter Note</h4>
                </div>
                <p className="wait-card-text">
                  Craving our signature iced maple latte, thickshakes, or extra maple syrup? Just let our counter team know when you collect your order.
                </p>
                <div className="wait-card-links">
                  <a
                    href={venueInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wait-link"
                  >
                    <InstagramIcon size={14} />
                    <span>Follow @thepancakeclub</span>
                  </a>
                  <span className="dot-sep">·</span>
                  <Link href="/book" className="wait-link">
                    <Calendar size={14} aria-hidden="true" />
                    <span>Book a Table Next Time</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Itemized Diner Receipt */}
            <div className="order-receipt-column">
              <div className="order-receipt-paper">
                <div className="receipt-header">
                  <div className="receipt-logo">THE PANCAKE CLUB</div>
                  {venueDisplayAddress && <div className="receipt-sub">{venueDisplayAddress}</div>}
                  <div className="receipt-divider" />
                  <div className="receipt-meta-row">
                    <span>Customer: <b>{order.customer_name}</b></span>
                    <span>{new Date(order.created_at || Date.now()).toLocaleDateString("en-AU")}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span>Order: <b>#{formatOrderRef(order.public_id)}</b></span>
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
                        <Tag size={12} aria-hidden="true" /> {order.coupon_code || "Discount"}
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
                      <CheckCircle2 size={18} className="badge-icon" aria-hidden="true" />
                      <div>
                        <b>Paid Online (Stripe)</b>
                        <div className="badge-sub">Card payment confirmed</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} className="badge-icon" aria-hidden="true" />
                      <div>
                        <b>Pay at Counter on Collection</b>
                        <div className="badge-sub">Cash, EFTPOS &amp; Tap-to-Pay accepted</div>
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
                  <Info size={12} aria-hidden="true" style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} />
                  Select <b>&ldquo;Save as PDF&rdquo;</b> in print dialog to download
                </div>

                <div className="receipt-footer-wrap">
                  <div className="receipt-footer-badge">
                    <Sparkles size={12} aria-hidden="true" />
                    <span>{venueAddress ? `Freshly Griddled · ${venueLocality}` : "Freshly Griddled"}</span>
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
            <div className="not-found-icon">{orderError ? <AlertCircle size={32} /> : <Search size={32} />}</div>
            <h2>{orderError ? "Status temporarily unavailable" : "Order Lookup"}</h2>
            <p>
              {orderError
                ? orderError
                : "We couldn’t find an active order with that reference. If you recently placed an order, please enter your Order ID below."}
            </p>

            {orderError && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={orderQuery.isFetching}
                onClick={() => orderQuery.refetch()}
              >
                {orderQuery.isFetching ? "Checking again…" : "Try again"}
              </button>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualId.trim()) {
                  window.location.assign(`/order/success?order=${encodeURIComponent(manualId.trim())}`);
                }
              }}
              className="order-lookup-form"
            >
              <div className={`float-field ${manualId ? "is-floated" : ""}`} style={{ flex: 1 }}>
                <input
                  id="order-search-input"
                  type="text"
                  className="float-input"
                  placeholder=" "
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                />
                <label htmlFor="order-search-input" className="float-label">
                  Order Reference (e.g. #TPC-123456)
                </label>
                <Search size={18} className="float-icon" aria-hidden="true" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ minHeight: "56px" }}>
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
