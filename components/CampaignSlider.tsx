"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { endsLabel, type ApiAnnouncement } from "@/lib/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=800&q=80";

export default function CampaignSlider({ items }: { items: ApiAnnouncement[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const numItems = items?.length || 0;

  // Scroll-driven progress: advances slides as user scrolls down the section
  useEffect(() => {
    if (numItems <= 1) return;

    const handleScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolledIn = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolledIn / totalScrollable));

      const targetIndex = Math.min(
        numItems - 1,
        Math.floor(progress * numItems)
      );

      setActiveIndex(targetIndex);

      // Reset auto-play idle timer on scroll
      isScrollingRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 3500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [numItems]);

  // Idle auto-advance: when user is looking at the section without scrolling, advance automatically
  useEffect(() => {
    if (numItems <= 1) return;

    const interval = setInterval(() => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.75 &&
        rect.bottom > window.innerHeight * 0.25;

      if (inView && !isScrollingRef.current) {
        setActiveIndex((prev) => (prev + 1) % numItems);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [numItems]);

  if (!items || numItems === 0) return null;

  const trackHeight = numItems > 1 ? `${numItems * 85}vh` : "auto";

  return (
    <div
      ref={trackRef}
      className="camp-scroll-track"
      style={{ height: trackHeight }}
    >
      <div className="camp-sticky-box">
        <div className="camp">
          {/* Vertical Pagination Dots */}
          {numItems > 1 && (
            <div className="camp-swiper-pagination" aria-label="Campaign slides">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`camp-vbullet${i === activeIndex ? " camp-vbullet-active" : ""}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Stacked Slides */}
          <div className="camp-slides-wrapper">
            {items.map((c, i) => {
              const urgency = endsLabel(c.ends_at);
              const imgSrc = c.image || DEFAULT_IMAGE;
              const isActive = i === activeIndex;

              return (
                <article
                  key={c.message + i}
                  className={`camp-slide camp-slide-layered${isActive ? " is-active" : ""}`}
                  aria-hidden={!isActive}
                >
                  {/* Left: Inset rounded image */}
                  <div className="camp-left">
                    <div className="camp-shot">
                      <Image
                        src={imgSrc}
                        alt={c.message}
                        fill
                        sizes="(min-width: 900px) 45vw, 90vw"
                        priority={i === 0}
                      />
                    </div>
                  </div>

                  {/* Decorative signal icon top-center */}
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

                  {/* Right: Copy + botanical art */}
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
                    <span className="camp-botanical" aria-hidden="true" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
