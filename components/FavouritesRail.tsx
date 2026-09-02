"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { TAG_LABEL, money, type ApiMenuItem } from "@/lib/api";

const TAGS: ApiMenuItem["tag"][] = ["sweet", "savoury", "choc"];
const TAG_ICONS: Record<ApiMenuItem["tag"], string> = {
  sweet: "🍯",
  savoury: "🍳",
  choc: "🍫",
};

const MAX = 6;

export default function FavouritesRail({
  items,
  title,
  subhead,
  cta,
}: {
  items: ApiMenuItem[];
  variant?: "v1" | "v2";
  title: ReactNode;
  subhead?: { title: string; text: string };
  cta?: { href: string; label: string };
}) {
  const [tab, setTab] = useState<"all" | ApiMenuItem["tag"]>("all");

  const counts = TAGS.map((tag) => ({
    tag,
    count: items.filter((i) => i.tag === tag).length,
  })).filter((c) => c.count > 0);

  const shown = (tab === "all" ? items : items.filter((i) => i.tag === tab)).slice(0, MAX);

  return (
    <>
      <div className="fav-head">
        <div className="fav-h">{title}</div>
        <div className="fav-tabs" role="tablist" aria-label="Menu categories">
          <button
            role="tab"
            type="button"
            aria-selected={tab === "all"}
            className={`fav-pill all${tab === "all" ? " on" : ""}`}
            onClick={() => setTab("all")}
          >
            <span className="pill-icon">✨</span>
            <span className="pill-label">All Stacks</span>
            <span className="n">{items.length}</span>
          </button>
          {counts.map((c) => (
            <button
              key={c.tag}
              role="tab"
              type="button"
              aria-selected={tab === c.tag}
              className={`fav-pill ${c.tag}${tab === c.tag ? " on" : ""}`}
              onClick={() => setTab(c.tag)}
            >
              <span className="pill-icon">{TAG_ICONS[c.tag]}</span>
              <span className="pill-label">{TAG_LABEL[c.tag]}</span>
              <span className="n">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {subhead && (
        <div className="fav-head sub">
          <div>
            <h2>{subhead.title}</h2>
            <p className="fav-sub">{subhead.text}</p>
          </div>
          {cta && (
            <Link href={cta.href} className="btn btn-primary">
              {cta.label}
            </Link>
          )}
        </div>
      )}

      {/* Boutique Diner Menu Cards Grid */}
      <div className="fav-grid">
        {shown.map((m) => {
          const imgSrc = m.photo || m.image;
          const stageClass = `stage-${m.tag || "sweet"}`;

          return (
            <Link href={`/menu/${m.slug}`} className="fav-diner-card" key={m.slug}>
              {/* Top Bar: Tag Badge + Price Pill */}
              <div className="fav-card-top">
                <span className={`fav-tag-badge tag-${m.tag}`}>
                  <span>{TAG_ICONS[m.tag] || "🥞"}</span>
                  {TAG_LABEL[m.tag] || "Pancake"}
                </span>
                <span className="fav-price-pill">{money(m.price)}</span>
              </div>

              {/* Dish Photo Stage with Soft Radial Glow */}
              <div className={`fav-photo-stage ${stageClass}`}>
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={m.name}
                    width={400}
                    height={300}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 85vw"
                    className="fav-dish-img"
                  />
                ) : (
                  <div className="fav-dish-placeholder">
                    <span className="placeholder-icon">🥞</span>
                    <span className="placeholder-text">Chef&apos;s Special</span>
                  </div>
                )}

                {/* Popular / Special Marker */}
                {parseFloat(String(m.price)) > 18 && (
                  <span className="fav-crowd-marker">
                    <Sparkles size={11} className="inline mr-1" />
                    Special
                  </span>
                )}
              </div>

              {/* Bottom Body Content (Inside Card) */}
              <div className="fav-card-body">
                <h3 className="fav-card-name">{m.name}</h3>
                <p className="fav-card-desc">
                  {m.description || "Freshly griddled fluffy pancake stack served with house whipped butter and warm maple syrup."}
                </p>

                {/* Card Action Link */}
                <div className="fav-card-action">
                  <span>View Details</span>
                  <ArrowRight size={14} className="fav-arrow" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {cta && !subhead && (
        <div className="fav-foot">
          <Link href={cta.href} className="btn btn-primary fav-cta-btn">
            <span>{cta.label}</span>
            <ArrowRight size={16} className="fav-foot-arrow" />
          </Link>
        </div>
      )}
    </>
  );
}
