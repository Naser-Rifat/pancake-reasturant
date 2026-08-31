"use client";

// The reference's panel rail: each visual sits in its own rounded panel, the
// rail bleeds past the section edge so the next panel is visibly sliced —
// that cut edge is the "there's more" cue. Click any panel for the lightbox.

import { useEffect, useState } from "react";
import Image from "next/image";

export type DishImage = { id: string; src: string; alt: string; cutout?: boolean };

export default function DishGallery({ images, name }: { images: DishImage[]; name: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

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

  // a dish with no cutout was handed { src: "" }, which makes the browser
  // re-request the page as an image — drop those before rendering
  images = images.filter((i) => i.src);
  if (images.length === 0) return null;

  return (
    <>
      <div className="drail">
        {images.map((img, i) => (
          <button
            type="button"
            className="dpanel"
            key={img.id}
            onClick={() => setLightbox(i)}
            aria-label={`View ${img.alt || name} full size`}
          >
            <span className={`dpanel-img${img.cutout ? " cut" : ""}`}>
              <Image
                src={img.src}
                alt={img.alt || name}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 40vw, 86vw"
              />
            </span>
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <p className="drail-hint">
          {images.length} views · swipe or tap to enlarge
        </p>
      )}

      {lightbox !== null && (
        <div className="plbx" role="dialog" aria-modal="true" aria-label={`Photos of ${name}`}>
          <button className="plbx-close" onClick={() => setLightbox(null)} aria-label="Close photos">✕</button>
          <div className="plbx-track">
            {images.map((img) => (
              <figure key={img.id}>
                <Image src={img.src} alt={img.alt || name} width={1100} height={880} sizes="92vw" />
                {img.alt && <figcaption>{img.alt}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
