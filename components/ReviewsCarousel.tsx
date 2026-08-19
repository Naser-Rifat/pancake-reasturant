"use client";

import { useEffect, useRef } from "react";
import { stars, type ApiReview } from "@/lib/api";

export default function ReviewsCarousel({ reviews }: { reviews: ApiReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const step = () => {
    const card = trackRef.current?.querySelector<HTMLElement>(".rev-card");
    return card ? card.offsetWidth + 22 : 360;
  };

  const scroll = (dir: number) =>
    trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  useEffect(() => {
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track || pausedRef.current || document.hidden) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else track.scrollBy({ left: step(), behavior: "smooth" });
    }, 4500);
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
        {reviews.map((r) => (
          <article className="rev-card" key={`${r.name}-${r.suburb}`}>
            <div className="rev-stars">{stars(r.rating)}</div>
            <p className="quote">&ldquo;{r.quote}&rdquo;</p>
            <div className="who">
              <span className="avatar">{r.avatar || "😀"}</span>
              {r.name}
              {r.suburb ? ` · ${r.suburb}` : ""}
            </div>
          </article>
        ))}
      </div>
      <div className="rev-nav">
        <button className="rev-btn" aria-label="Previous reviews" onClick={() => scroll(-1)}>←</button>
        <button className="rev-btn" aria-label="Next reviews" onClick={() => scroll(1)}>→</button>
      </div>
    </div>
  );
}
