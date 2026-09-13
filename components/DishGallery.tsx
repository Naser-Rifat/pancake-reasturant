"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DishImage = { id: string; src: string; alt: string; cutout?: boolean };

export default function DishGallery({ images, name }: { images: DishImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Touch swipe state for hero stage
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Thumbs ref for horizontal sliding
  const thumbsRef = useRef<HTMLDivElement | null>(null);

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

  // Clean empty src images
  const validImages = images.filter((i) => i.src);
  if (validImages.length === 0) return null;

  const currentImg = validImages[activeIndex] || validImages[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (diff > minSwipeDistance && activeIndex < validImages.length - 1) {
      // Swiped left -> next
      setActiveIndex((prev) => prev + 1);
    } else if (diff < -minSwipeDistance && activeIndex > 0) {
      // Swiped right -> prev
      setActiveIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="dish-hero-container">
      {/* Floating Hero Stage: unboxed cutout directly on warm ground */}
      <div
        className="dish-hero-stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setLightbox(activeIndex)}
        role="button"
        tabIndex={0}
        aria-label={`View full resolution photos of ${name}`}
        onKeyDown={(e) => e.key === "Enter" && setLightbox(activeIndex)}
      >
        {/* Hero Image Presentation */}
        {currentImg.cutout ? (
          <div className="dish-hero-cutout-wrap" key={currentImg.id}>
            <Image
              src={currentImg.src}
              alt={currentImg.alt || name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 92vw"
              className="dish-hero-cutout"
            />
          </div>
        ) : (
          <div className="dish-hero-photo-frame" key={currentImg.id}>
            <div
              className="dish-hero-photo-ambient"
              style={{ backgroundImage: `url(${currentImg.src})` }}
              aria-hidden="true"
            />
            <Image
              src={currentImg.src}
              alt={currentImg.alt || name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 92vw"
              className="dish-hero-photo-img"
            />
          </div>
        )}

        {/* Floating Frosted Pill Badge Counter (matches Reference Image 2: "1 / 3") */}
        {validImages.length > 1 && (
          <div className="dish-hero-counter" aria-label={`Photo ${activeIndex + 1} of ${validImages.length}`}>
            <span>{activeIndex + 1} / {validImages.length}</span>
          </div>
        )}

        {/* Navigation Chevrons for desktop/tablet */}
        {validImages.length > 1 && (
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
              disabled={activeIndex === validImages.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((i) => Math.min(validImages.length - 1, i + 1));
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Bar for multi-photo dishes with smooth sliding */}
      {validImages.length > 1 && (
        <div
          className="dish-hero-thumbs"
          ref={thumbsRef}
          role="tablist"
          aria-label="Photo angles"
        >
          {validImages.map((img, i) => (
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
            {validImages.map((img, idx) => (
              <figure key={img.id} className={idx === lightbox ? "active-photo" : ""}>
                <Image
                  src={img.src}
                  alt={img.alt || name}
                  width={1100}
                  height={880}
                  sizes="92vw"
                  priority={idx === lightbox}
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

