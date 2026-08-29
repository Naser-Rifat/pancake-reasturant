"use client";

// Category count pills + the favourites scroll rail, shared by both designs.
// The pills filter the rail — they look like controls, so they behave like them.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { TAG_LABEL, type ApiMenuItem } from "@/lib/api";

const TAGS: ApiMenuItem["tag"][] = ["sweet", "savoury", "choc"];
const MAX = 6;

const SKIN = {
  v1: { head: "fav-head", h: "fav-h", tabs: "fav-tabs", pill: "fav-pill", tints: ["a", "b", "c"], rail: "fav-grid", card: "fav-card" },
  v2: { head: "v2-band-head", h: "", tabs: "v2-pill-rows", pill: "v2-pill", tints: ["gold", "sky", "lav"], rail: "v2-favs-grid", card: "v2-fav" },
} as const;

export default function FavouritesRail({
  items,
  variant = "v1",
  title,
  middle,
  footer,
}: {
  items: ApiMenuItem[];
  variant?: keyof typeof SKIN;
  /** headline block sitting opposite the category pills */
  title: ReactNode;
  /** block rendered between the pills row and the rail */
  middle?: ReactNode;
  /** block rendered under the rail (e.g. the "view full menu" CTA) */
  footer?: ReactNode;
}) {
  const [tab, setTab] = useState<"all" | ApiMenuItem["tag"]>("all");
  const s = SKIN[variant];

  const counts = TAGS.map((tag) => ({ tag, count: items.filter((i) => i.tag === tag).length })).filter(
    (c) => c.count > 0
  );
  const shown = (tab === "all" ? items : items.filter((i) => i.tag === tab)).slice(0, MAX);

  return (
    <>
      <div className={s.head}>
        <div className={s.h}>{title}</div>
        <div className={s.tabs} role="tablist" aria-label="Menu categories">
          {counts.map((c, i) => (
            <button
              key={c.tag}
              role="tab"
              aria-selected={tab === c.tag}
              className={`${s.pill} ${s.tints[i % s.tints.length]}${tab === c.tag ? " on" : ""}`}
              onClick={() => setTab(c.tag)}
            >
              {TAG_LABEL[c.tag]} <span className="n">{c.count}</span>
            </button>
          ))}
          <button
            role="tab"
            aria-selected={tab === "all"}
            className={`${s.pill}${tab === "all" ? " on" : ""}`}
            onClick={() => setTab("all")}
          >
            All Stacks <span className="n">{items.length}</span>
          </button>
        </div>
      </div>

      {middle}

      <div className={s.rail}>
        {shown.map((m) => (
          <Link href="/menu" className={s.card} key={m.slug}>
            <span className={`ph${m.photo ? " framed" : ""}`}>
              <Image
                src={m.photo || m.image}
                alt={m.name}
                fill
                sizes="(min-width: 1024px) 30vw, 88vw"
              />
              {/* hover flood: the full card turns into the dish detail */}
              <span className="hp" aria-hidden="true">
                <b className="hp-name">{m.name}</b>
                <span className="hp-price">${parseFloat(m.price)}</span>
                <span className="hp-desc">{m.description}</span>
                <span className="hp-cta">See on Menu →</span>
              </span>
            </span>
            <span className="nm">{m.name}</span>
            <span className="pr">$ {parseFloat(m.price).toFixed(2)} AUD</span>
          </Link>
        ))}
      </div>

      {footer}
    </>
  );
}
