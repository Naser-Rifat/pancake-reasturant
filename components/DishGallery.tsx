"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DishImage = { id: string; src: string; alt: string; cutout?: boolean };

export default function DishGallery({
  images,
  name,
  price,
}: {
  images: DishImage[];
  name: string;
  price?: number | string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Touch swipe state for hero stage
  const touchStartX = useRef<number | null>(null);

  // Thumbs ref for horizontal sliding
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  // Filter valid images or provide fallback
  const validImages = images.filter((i) => Boolean(i.src));
  const displayImages =
    validImages.length > 0
      ? validImages
      : [{ id: "fallback", src: "/menu/buttermilk.png", alt: name, cutout: true }];

  // Auto-scroll the active thumbnail into center view smoothly
  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.querySelector<HTMLElement>(".dish-thumb.is-active");
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const currentImg = displayImages[activeIndex] || displayImages[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const minSwipeDistance = 40;

    if (diff > minSwipeDistance && activeIndex < displayImages.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else if (diff < -minSwipeDistance && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div className="dish-hero-container">
      {/* Authentic Retro Diner Hero Frame with Signature Rotating Price Badge */}
      <div
        className="hf-photo dish"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setLightbox(activeIndex)}
        role="button"
        tabIndex={0}
        aria-label={`View photo of ${name}`}
        onKeyDown={(e) => e.key === "Enter" && setLightbox(activeIndex)}
      >
        <Image
          src={currentImg.src}
          alt={currentImg.alt || name}
          fill
          priority
          sizes="(min-width: 1024px) 680px, 100vw"
          className={currentImg.cutout ? "as-cutout" : "as-photo"}
          unoptimized={currentImg.src.startsWith("/")}
        />

        {/* Signature Rotating Circular Price Badge */}
        {price != null && (
          <span className="price-spin" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs>
                <path id="dishring" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
              </defs>
              <text>
                <textPath href="#dishring">fresh daily • est. 1999 •</textPath>
              </text>
            </svg>
            <span className="num">
              ${typeof price === "number" ? (price % 1 === 0 ? price : price.toFixed(2)) : price}
            </span>
          </span>
        )}

        {/* Photo Counter Pill if multiple photos */}
        {displayImages.length > 1 && (
          <div className="dish-hero-counter" aria-label={`Photo ${activeIndex + 1} of ${displayImages.length}`}>
            <span>{activeIndex + 1} / {displayImages.length}</span>
          </div>
        )}

        {/* Navigation Chevrons for desktop/tablet */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              className="dish-hero-arrow prev"
              disabled={activeIndex === 0}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) => Math.max(0, i - 1));
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="dish-hero-arrow next"
              disabled={activeIndex === displayImages.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) => Math.min(displayImages.length - 1, i + 1));
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Bar for multi-photo dishes with smooth sliding */}
      {displayImages.length > 1 && (
        <div
          className="dish-hero-thumbs"
          ref={thumbsRef}
          role="tablist"
          aria-label="Photo angles"
        >
          {displayImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              className={`dish-thumb ${i === activeIndex ? "is-active" : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <span className="dish-thumb-box">
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="64px"
                  className={img.cutout ? "cut" : ""}
                  unoptimized={img.src.startsWith("/")}
                />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightbox !== null && (
        <div className="plbx" role="dialog" aria-modal="true" aria-label={`Photos of ${name}`}>
          <button className="plbx-close" onClick={() => setLightbox(null)} aria-label="Close photos">
            ✕
          </button>
          <div className="plbx-track">
            {displayImages.map((img, idx) => (
              <figure key={img.id} className={idx === lightbox ? "active-photo" : ""}>
                <Image
                  src={img.src}
                  alt={img.alt || name}
                  width={1100}
                  height={880}
                  sizes="92vw"
                  priority={idx === lightbox}
                  unoptimized={img.src.startsWith("/")}
                />
                {img.alt && <figcaption>{img.alt}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

