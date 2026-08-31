"use client";

// Category count pills + the favourites scroll rail, shared by both designs.
// The pills filter the rail — they look like controls, so they behave like them.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { TAG_LABEL, money, type ApiMenuItem } from "@/lib/api";

const TAGS: ApiMenuItem["tag"][] = ["sweet", "savoury", "choc"];
const MAX = 6;

const SKIN = {
  v1: {
    head: "fav-head", h: "fav-h", tabs: "fav-tabs", pill: "fav-pill", tints: ["a", "b", "c"],
    rail: "fav-grid", card: "fav-card", sub: "fav-head sub", subText: "fav-sub",
    foot: "fav-foot", cta: "btn btn-primary",
  },
  v2: {
    head: "v2-band-head", h: "", tabs: "v2-pill-rows", pill: "v2-pill", tints: ["gold", "sky", "lav"],
    rail: "v2-favs-grid", card: "v2-fav", sub: "v2-band-head sub", subText: "v2-favs-sub",
    foot: "", cta: "v2-btn small",
  },
} as const;

export default function FavouritesRail({
  items,
  variant = "v1",
  title,
  subhead,
  cta,
}: {
  items: ApiMenuItem[];
  variant?: keyof typeof SKIN;
  /** headline block sitting opposite the category pills — host elements only:
   *  passing components (e.g. <Link>) across the server→client boundary trips
   *  React's key validation */
  title: ReactNode;
  /** optional second heading between the pills and the rail */
  subhead?: { title: string; text: string };
  /** "view full menu" link — inside the subhead when there is one, else under the rail */
  cta?: { href: string; label: string };
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

      {subhead && (
        <div className={s.sub}>
          <div>
            <h2>{subhead.title}</h2>
            <p className={s.subText}>{subhead.text}</p>
          </div>
          {cta && <Link href={cta.href} className={s.cta}>{cta.label}</Link>}
        </div>
      )}

      <div className={s.rail}>
        {shown.map((m) => (
          <Link href={`/menu/${m.slug}`} className={s.card} key={m.slug}>
            <span className={`ph${m.photo ? " framed" : ""}`}>
              <Image
                src={m.photo || m.image}
                alt={m.name}
                fill
                sizes="(min-width: 1024px) 30vw, 88vw"
              />
              {/* hover flood: the full card turns into the dish detail */}
              {/* the panel adds what the card doesn't already show — the name and
                  price sit right below it, so repeating them on hover just put
                  the same two lines on screen twice */}
              <span className="hp" aria-hidden="true">
                <span className="hp-desc">{m.description}</span>
                {/* the card links to the dish's own page, not the menu list —
                    the old label promised the wrong destination */}
                <span className="hp-cta">View dish →</span>
              </span>
            </span>
            <span className="nm">{m.name}</span>
            <span className="pr">{money(m.price)}</span>
          </Link>
        ))}
      </div>

      {cta && !subhead && (
        <div className={s.foot}>
          <Link href={cta.href} className={s.cta}>{cta.label}</Link>
        </div>
      )}
    </>
  );
}
