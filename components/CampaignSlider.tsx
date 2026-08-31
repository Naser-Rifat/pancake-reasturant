"use client";

// Campaign slider — vertical top-to-bottom one-by-one scroll:
// Slides are arranged vertically and transition with translateY(top-to-bottom).
// Intercepts vertical wheel and touch swipes when in view, transitions one slide
// at a time, and releases page scroll at start/end boundaries.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { countdownBadge, endsLabel, type ApiAnnouncement } from "@/lib/api";

const COOLDOWN_MS = 650;
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=800&q=80";

export default function CampaignSlider({ items }: { items: ApiAnnouncement[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [dotKey, setDotKey] = useState(0);

  const cooldownRef = useRef(false);
  const releasedRef = useRef<"up" | "down" | null>(null);
  const touchStartY = useRef<number | null>(null);

  const setSlide = useCallback(
    (newIndex: number) => {
      const next = Math.max(0, Math.min(items.length - 1, newIndex));
      setIndex(next);
      setDotKey((k) => k + 1);
    },
    [items.length],
  );

  // Wheel interception for vertical one-by-one scrolling
  useEffect(() => {
    if (items.length <= 1) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onWheel = (e: WheelEvent) => {
      const rect = wrap.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;

      if (!inView) {
        releasedRef.current = null;
        return;
      }

      // Need enough delta to trigger
      if (Math.abs(e.deltaY) < 12) return;

      const direction = e.deltaY > 0 ? "down" : "up";

      if (releasedRef.current === direction) return;
      if (releasedRef.current && releasedRef.current !== direction) {
        releasedRef.current = null;
      }

      const atStart = index === 0 && direction === "up";
      const atEnd = index === items.length - 1 && direction === "down";

      if (atStart || atEnd) {
        releasedRef.current = direction;
        return;
      }

      e.preventDefault();

      if (cooldownRef.current) return;
      cooldownRef.current = true;

      const next = direction === "down" ? index + 1 : index - 1;
      setSlide(next);

      setTimeout(() => {
        cooldownRef.current = false;
      }, COOLDOWN_MS);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [items.length, index, setSlide]);

  // Touch gesture support (swipe up / swipe down)
  useEffect(() => {
    if (items.length <= 1) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;
      touchStartY.current = null;

      if (Math.abs(diff) < 40) return; // small gesture ignore

      if (diff > 0 && index < items.length - 1) {
        // swipe up -> next slide
        setSlide(index + 1);
      } else if (diff < 0 && index > 0) {
        // swipe down -> prev slide
        setSlide(index - 1);
      }
    };

    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchend", onTouchEnd);
    };
  }, [items.length, index, setSlide]);

  if (items.length === 0) return null;

  return (
    <div className="camp" ref={wrapRef}>
      {/* Permanent floating vertical navigation dots on left */}
      {items.length > 1 && (
        <div className="camp-vdots-wrap">
          <span className="camp-vdots" role="tablist" aria-label="Offers">
            {items.map((item, j) => (
              <button
                key={`${item.message}-${dotKey}`}
                type="button"
                role="tab"
                aria-selected={j === index}
                aria-label={`Offer ${j + 1} of ${items.length}`}
                className={j === index ? "on" : ""}
                onClick={() => setSlide(j)}
              />
            ))}
          </span>
        </div>
      )}

      <div className="camp-viewport">
        <div
          className="camp-track-vertical"
          style={{ transform: `translateY(-${index * 100}%)` }}
        >
          {items.map((c, i) => {
            const urgency = endsLabel(c.ends_at);
            const imgSrc = c.image || DEFAULT_IMAGE;
            return (
              <article
                className={`camp-slide ${i === index ? "active" : ""}`}
                key={c.message}
              >
                {/* left: inset rounded image */}
                <div className="camp-left">
                  <div className="camp-shot">
                    <Image
                      src={imgSrc}
                      alt={c.message}
                      fill
                      sizes="(min-width: 900px) 40vw, 88vw"
                    />
                  </div>
                </div>

                {/* decorative signal icon top-center between image and copy */}
                <span className="camp-deco-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 32 32"
                    width="36"
                    height="36"
                    fill="none"
                    stroke="var(--yellow-deep)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path
                      d="M16 24a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
                      fill="var(--yellow-deep)"
                      stroke="none"
                    />
                    <path d="M10 20a8.5 8.5 0 0 1 12 0" />
                    <path d="M6 16a14 14 0 0 1 20 0" />
                  </svg>
                </span>

                {/* right: copy + botanical art */}
                <div className="camp-copy">
                  <h3>{c.message}</h3>
                  {c.details && <p className="camp-details">{c.details}</p>}
                  {urgency && <span className="camp-urgency">{urgency}</span>}
                  {c.link_url && (
                    <Link href={c.link_url} className="camp-cta">
                      <span className="camp-cta-dot" aria-hidden="true" />
                      {c.link_text || "Book a Table"}
                    </Link>
                  )}
                  {/* botanical wheat illustration */}
                  <span className="camp-botanical" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}


