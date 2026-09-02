"use client";

import { useEffect, useRef } from "react";
import { Quote, Sparkles, CheckCircle2 } from "lucide-react";
import { type ApiReview } from "@/lib/api";

const DINER_TAGS = [
  { text: "Verified Diner", icon: "🥞" },
  { text: "Brunch Regular", icon: "☕" },
  { text: "Sweet Tooth", icon: "🍓" },
  { text: "Sydney Local", icon: "✨" },
  { text: "Weekend Feast", icon: "💛" },
];

export default function ReviewsCarousel({ reviews }: { reviews: ApiReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const step = () => {
    const card = trackRef.current?.querySelector<HTMLElement>(".rev-card");
    return card ? card.offsetWidth + 24 : 360;
  };

  const scroll = (dir: number) =>
    trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      track.dataset.atStart = String(track.scrollLeft < 10);
      const last = track.lastElementChild;
      track.dataset.atEnd = String(
        !!last && last.getBoundingClientRect().right <= track.getBoundingClientRect().right + 10,
      );
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track || pausedRef.current || document.hidden) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else track.scrollBy({ left: step(), behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (!reviews.length) return null;

  return (
    <div className="reviews-wrap reveal">
      <div
        className="rev-track"
        ref={trackRef}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {reviews.map((r, i) => {
          const tag = DINER_TAGS[i % DINER_TAGS.length];
          return (
            <article className="rev-card diner-guest-card" key={`${r.name}-${r.suburb}-${i}`}>
              {/* Decorative quotation watermark */}
              <div className="rev-quote-watermark" aria-hidden="true">
                “
              </div>

              {/* Card Header: Stars + Diner Tag */}
              <div className="rev-card-header">
                <div className="rev-stars" aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
                <div className="diner-badge">
                  <span>{tag.icon}</span> {tag.text}
                </div>
              </div>

              {/* Review Text */}
              <p className="quote">&ldquo;{r.quote}&rdquo;</p>

              {/* Guest Footer */}
              <div className="who">
                <span className="avatar">{r.avatar || "🥞"}</span>
                <div className="who-info">
                  <span className="who-name">{r.name}</span>
                  {r.suburb && <span className="who-suburb">📍 {r.suburb}, Sydney</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Retro Navigation Buttons */}
      <div className="rev-nav">
        <button className="rev-btn" aria-label="Previous reviews" onClick={() => scroll(-1)}>
          ←
        </button>
        <button className="rev-btn" aria-label="Next reviews" onClick={() => scroll(1)}>
          →
        </button>
      </div>
    </div>
  );
}
