"use client";

// Campaign slider — vertical top-to-bottom one-by-one Swiper slider:
// Slides transition smoothly vertically with Swiper.
// Supports vertical touch gestures, vertical mousewheel (releases page scroll at boundaries),
// autoplay with pause-on-hover, and custom vertical floating pagination pills.

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Mousewheel, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { endsLabel, type ApiAnnouncement } from "@/lib/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=800&q=80";

export default function CampaignSlider({ items }: { items: ApiAnnouncement[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="camp">
      {/* Floating Vertical Pagination Container on the left */}
      {items.length > 1 && (
        <div className="camp-swiper-pagination" aria-label="Campaign slides" />
      )}

      <Swiper
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0}
        speed={650}
        loop={items.length > 1}
        mousewheel={{
          releaseOnEdges: true,
          forceToAxis: true,
        }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={
          items.length > 1
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
        modules={[Autoplay, Mousewheel, Pagination]}
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

                {/* Decorative signal icon top-center between image and copy */}
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
                  {/* Botanical wheat line art */}
                  <span className="camp-botanical" aria-hidden="true" />
                </div>
              </article>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
