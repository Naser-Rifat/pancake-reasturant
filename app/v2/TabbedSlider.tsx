"use client";

// V1's home menu-slider merged into the Rollin carousel language:
// category tabs (pink active pill) filtering pastel tiles with product cutouts.

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Carousel from "./Carousel";
import { TAG_LABEL, type ApiMenuItem } from "@/lib/api";

const TABS = ["all", "sweet", "savoury", "choc"] as const;
const TILE_COLORS = ["gold", "sky", "peach", "lav"];

const Sprinkles = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 46 30" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 8 l6 -4" /><path d="M20 24 l6 -4" /><path d="M34 10 l6 -4" /><circle cx="14" cy="18" r="1.6" fill="currentColor" stroke="none" /><circle cx="40" cy="22" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export default function TabbedSlider({ items }: { items: ApiMenuItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const shown = tab === "all" ? items : items.filter((i) => i.tag === tab);

  return (
    <>
      <div className="v2-tabs" role="tablist" aria-label="Menu categories">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "on" : ""}
            onClick={() => setTab(t)}
          >
            {t === "all" ? "All Stacks" : TAG_LABEL[t]}
          </button>
        ))}
      </div>
      <Carousel key={tab}>
        {shown.map((m, i) => (
          <div className="v2-car-cell" key={m.slug}>
            <Link href="/menu" className={`v2-tile menu ${TILE_COLORS[i % TILE_COLORS.length]}`}>
              <Sprinkles className="v2-sprinkles" />
              <span className="v2-price-tag">${parseFloat(m.price)}</span>
              <div className="v2-menu-cut">
                <Image src={m.image} alt={m.name} width={400} height={400} sizes="(min-width: 1024px) 30vw, 76vw" />
              </div>
            </Link>
            <p className="v2-car-cap">{m.name}</p>
          </div>
        ))}
      </Carousel>
    </>
  );
}
