"use client";

import { useEffect, useState } from "react";
import type { ApiGalleryPhoto } from "@/lib/api";

type Album = ApiGalleryPhoto["album"];

const ALBUMS: [Album | "all", string][] = [
  ["all", "All"],
  ["food", "🥞 Food"],
  ["interior", "🪑 Interior"],
  ["events", "🎉 Events"],
];

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

  return (
    <>
      <div className="album-tabs">
        {ALBUMS.map(([key, label]) => (
          <button
            key={key}
            className={`album-tab${album === key ? " active" : ""}`}
            onClick={() => { setAlbum(key); setCurrent(null); }}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="container" style={{ paddingBottom: "6rem" }}>
        <div className="gallery-grid" style={{ marginTop: "1rem" }}>
          {visible.map((p, i) => (
            <a
              href="#"
              key={p.image}
              onClick={(e) => { e.preventDefault(); show(i); }}
            >
              <img src={p.image} alt={p.alt} loading="lazy" />
            </a>
          ))}
        </div>
      </main>

      {photo && (
        <div
          className="lightbox open"
          onClick={(e) => { if (e.target === e.currentTarget) setCurrent(null); }}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(current! + (dx < 0 ? 1 : -1));
            setTouchX(null);
          }}
        >
          <button className="lb-btn lb-close" aria-label="Close" onClick={() => setCurrent(null)}>✕</button>
          <button className="lb-btn lb-prev" aria-label="Previous photo" onClick={() => show(current! - 1)}>←</button>
          <img src={photo.image.replace("w=700", "w=1400")} alt={photo.alt} />
          <div className="lb-caption">{photo.caption}</div>
          <button className="lb-btn lb-next" aria-label="Next photo" onClick={() => show(current! + 1)}>→</button>
        </div>
      )}
    </>
  );
}
