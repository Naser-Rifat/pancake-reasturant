"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { endsLabel, type ApiAnnouncement } from "@/lib/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=800&q=80";

export default function CampaignSlider({
  items,
  title,
}: {
  items: ApiAnnouncement[];
  title?: React.ReactNode;
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const numItems = items?.length || 0;

  // Drive Swiper slide transition with outside window scroll
  useEffect(() => {
    if (numItems <= 1) return;

    const handleScroll = () => {
      if (!trackRef.current || !swiperRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolledIn = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolledIn / totalScrollable));

      const targetIndex = Math.min(
        numItems - 1,
        Math.floor(progress * numItems)
      );

      if (swiperRef.current.activeIndex !== targetIndex) {
        swiperRef.current.slideTo(targetIndex, 600);
      }

      // Pause autoplay while user is actively scrolling; restart after 3.5s idle
      if (swiperRef.current.autoplay) {
        swiperRef.current.autoplay.stop();
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (swiperRef.current && swiperRef.current.autoplay) {
          swiperRef.current.autoplay.start();
        }
      }, 3500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
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
        {title && <div className="camp-header-box">{title}</div>}
        <div className="camp">
          {/* Floating vertical pagination dots on left edge */}
          {numItems > 1 && (
            <div className="camp-swiper-pagination" aria-label="Campaign slides" />
          )}

          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            direction="vertical"
            slidesPerView={1}
            spaceBetween={0}
            speed={600}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={
              numItems > 1
                ? {
                    el: ".camp-swiper-pagination",
                    clickable: true,
                    bulletClass: "camp-vbullet",
                    bulletActiveClass: "camp-vbullet-active",
                    renderBullet: (_index, className) =>
                      `<button type="button" class="${className}" aria-label="Slide ${_index + 1}"></button>`,
                  }
                : false
            }
            modules={[Autoplay, Pagination]}
            className="camp-swiper"
          >
            {items.map((c) => {
              const urgency = endsLabel(c.ends_at);
              const imgSrc = c.image || DEFAULT_IMAGE;

              return (
                <SwiperSlide key={c.message} className="camp-swiper-slide">
                  <article className="camp-slide">
                    {/* Left: Inset rounded image */}
                    <div className="camp-left">
                      <div className="camp-shot">
                        <Image
                          src={imgSrc}
                          alt={c.message}
                          fill
                          sizes="(min-width: 900px) 45vw, 90vw"
                          priority
                        />
                      </div>
                    </div>

                    {/* scissors on the tear line — the coupon's own language; the old
                        signal-wave was drawn for the dark card and read as a stray mark */}
                    <span className="camp-deco-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        width="26"
                        height="26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M20 4 8.5 15.5" />
                        <path d="M14.5 9.5 20 20" />
                        <path d="M8.5 8.5 12 12" />
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
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </div>
  );
}
