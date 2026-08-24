"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TAG_LABEL, heatClass, type ApiMenuItem } from "@/lib/api";

const FILTERS: [("all" | ApiMenuItem["tag"]), string][] = [
  ["all", "All"],
  ["sweet", "Sweet"],
  ["savoury", "Savoury"],
  ["choc", "Choc Loaded"],
];

/** Home-page menu showcase: category pills + horizontal card slider. */
export default function FeaturedSlider({ items }: { items: ApiMenuItem[] }) {
  const [filter, setFilter] = useState<"all" | ApiMenuItem["tag"]>("all");
  const sliderRef = useRef<HTMLDivElement>(null);

  const visible = filter === "all" ? items : items.filter((b) => b.tag === filter);

  // arrows only make sense when the row actually overflows
  const [canSlide, setCanSlide] = useState(false);
  useEffect(() => {
    const check = () => {
      const el = sliderRef.current;
      setCanSlide(!!el && el.scrollWidth > el.clientWidth + 4);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [filter, items]);

  const slide = (dir: number) => {
    const track = sliderRef.current;
    const card = track?.querySelector<HTMLElement>(".menu-card");
    track?.scrollBy({ left: dir * ((card?.offsetWidth ?? 340) + 29), behavior: "smooth" });
  };

  return (
    <div className="reveal">
      <div className="album-tabs menu-tabs">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`album-tab${filter === key ? " active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="menu-slider" ref={sliderRef}>
        {visible.map((f) => (
          <article className="menu-card" key={f.slug}>
            <div className="thumb">
              <Image src={f.image} alt={`${f.name} pancakes`} width={600} height={600} sizes="340px" />
              <span className={`spice-tag ${heatClass(f.heat)}`}>{TAG_LABEL[f.tag]}</span>
            </div>
            <div className="body">
              <div className="row1">
                <h3>{f.name}</h3>
                <span className="price">${parseFloat(f.price)}</span>
              </div>
              <p className="desc">{f.description}</p>
              <Link href="/menu" className="btn btn-primary">See on Menu →</Link>
            </div>
          </article>
        ))}
      </div>

      {canSlide && (
        <div className="rev-nav">
          <button className="rev-btn" aria-label="Previous items" onClick={() => slide(-1)}>←</button>
          <button className="rev-btn" aria-label="Next items" onClick={() => slide(1)}>→</button>
        </div>
      )}
    </div>
  );
}
