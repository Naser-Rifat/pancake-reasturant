"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ZoomIn, Sparkles, Heart } from "lucide-react";
import type { ApiGalleryPhoto } from "@/lib/api";

type Album = ApiGalleryPhoto["album"];

const ALBUMS: { key: Album | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All Snaps", icon: "✨" },
  { key: "food", label: "Pancakes & Food", icon: "🥞" },
  { key: "interior", label: "The Space", icon: "☕" },
  { key: "events", label: "Good Times", icon: "🎉" },
];

const STAMPS = [
  { text: "100% Fluffy", icon: "🥞", color: "var(--yellow-deep)" },
  { text: "Fresh Brew", icon: "☕", color: "var(--brown)" },
  { text: "Sydney Vibes", icon: "✨", color: "var(--pink)" },
  { text: "Café Mood", icon: "💛", color: "var(--yellow-deep)" },
  { text: "Sweet Moments", icon: "🍓", color: "var(--pink-deep)" },
  { text: "Golden Maple", icon: "🍯", color: "var(--yellow-deep)" },
  { text: "Sizzling Fresh", icon: "🍳", color: "var(--pink)" },
];

const TAPES = ["tape-center", "tape-left", "tape-right", "tape-pin"];

export default function GalleryClient({ photos }: { photos: ApiGalleryPhoto[] }) {
  const [album, setAlbum] = useState<Album | "all">("all");
  const [current, setCurrent] = useState<number | null>(null); // index into `visible`, or null
  const [touchX, setTouchX] = useState<number | null>(null);

  const visible = album === "all" ? photos : photos.filter((p) => p.album === album);

  const show = (i: number) =>
    setCurrent(((i % visible.length) + visible.length) % visible.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (current === null) return;
      if (e.key === "Escape") setCurrent(null);
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const photo = current !== null ? visible[current] : null;

  // lock body scroll while the lightbox is open (mobile: prevents the wall scrolling underneath)
  useEffect(() => {
    if (current === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [current === null]);

  return (
    <>
      {/* Retro Pastel Filter Tabs */}
      <div className="album-tabs-wrapper">
        <div className="album-tabs">
          {ALBUMS.map(({ key, label, icon }) => {
            const count = key === "all" ? photos.length : photos.filter((p) => p.album === key).length;
            return (
              <button
                key={key}
                type="button"
                className={`album-tab-btn ${album === key ? "active" : ""}`}
                onClick={() => {
                  setAlbum(key);
                  setCurrent(null);
                }}
              >
                <span className="tab-icon">{icon}</span>
                <span className="tab-label">{label}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="container polaroid-wall-container" style={{ paddingBottom: "7rem" }}>
        <div className="polaroid-wall-grid">
          {visible.map((p, i) => {
            const stamp = STAMPS[i % STAMPS.length];
            const tape = TAPES[i % TAPES.length];
            const rotationClass = `tilt-${(i % 6) + 1}`;
            const captionText = p.caption || p.alt || "A sweet moment at The Pancake Club";

            return (
              <div
                key={p.image + i}
                className={`polaroid-card-wrapper ${rotationClass}`}
              >
                <a
                  href="#"
                  className="polaroid-card"
                  onClick={(e) => {
                    e.preventDefault();
                    show(i);
                  }}
                  aria-label={`View photo: ${captionText}`}
                >
                  {/* Washi Tape Accent */}
                  <div className={`washi-tape ${tape}`} aria-hidden="true" />

                  {/* Corner Badge / Stamp on selected photos */}
                  {i % 2 === 0 && (
                    <div className="polaroid-stamp" aria-hidden="true">
                      <span>{stamp.icon}</span> {stamp.text}
                    </div>
                  )}

                  {/* Photo Frame */}
                  <div className="polaroid-photo-frame">
                    <Image
                      src={p.image}
                      alt={p.alt || p.caption || "The Pancake Club gallery photo"}
                      width={700}
                      height={520}
                      sizes="(min-width: 1200px) 30vw, (min-width: 768px) 45vw, 92vw"
                      priority={i < 4}
                      className="polaroid-img"
                      style={{
                        objectPosition: `50% ${
                          p.focus === "top" ? "18%" : p.focus === "bottom" ? "82%" : "50%"
                        }`,
                      }}
                    />
                    <div className="polaroid-hover-overlay">
                      <div className="polaroid-zoom-pill">
                        <ZoomIn size={14} className="zoom-icon" />
                        <span>View Snap</span>
                      </div>
                    </div>
                  </div>

                  {/* Polaroid Bottom Chin (Handwritten Script & Stamp) */}
                  <div className="polaroid-chin">
                    <p className="polaroid-caption">{captionText}</p>
                    <div className="polaroid-meta">
                      <span className="polaroid-location">📍 The Pancake Club, Sydney</span>
                      <span className="polaroid-album-badge">{p.album}</span>
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      </main>

      {/* Lightbox */}
      {photo && (
        <div
          className="lightbox open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCurrent(null);
          }}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(current! + (dx < 0 ? 1 : -1));
            setTouchX(null);
          }}
        >
          <button
            className="lb-btn lb-close"
            aria-label="Close"
            onClick={() => setCurrent(null)}
          >
            ✕
          </button>
          <button
            className="lb-btn lb-prev"
            aria-label="Previous photo"
            onClick={() => show(current! - 1)}
          >
            ←
          </button>
          <div className="lb-stage">
            <Image
              src={photo.image.replace("w=700", "w=1400")}
              alt={photo.alt || photo.caption}
              fill
              sizes="92vw"
              className="lb-img"
            />
          </div>
          <div className="lb-caption-bar">
            <p className="lb-caption-text">{photo.caption}</p>
            <span className="lb-album-tag">#{photo.album}</span>
          </div>
          <button
            className="lb-btn lb-next"
            aria-label="Next photo"
            onClick={() => show(current! + 1)}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
