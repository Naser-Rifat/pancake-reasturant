"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Info,
  Maximize2,
  Monitor,
  Scissors,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Upload,
} from "lucide-react";
import DishCard from "@/components/DishCard";
import type { AdminCategory } from "@/lib/admin-api";
import type { ApiMenuItem } from "@/lib/api";
import type { FormState } from "../_lib";

interface DishPreviewAndGuideProps {
  form: FormState;
  categories?: AdminCategory[];
  onSetPhoto?: (url: string) => void;
  onSetImage?: (url: string) => void;
}

export function DishPreviewAndGuide({
  form,
  categories = [],
  onSetPhoto,
  onSetImage,
}: DishPreviewAndGuideProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "desktop" | "guide">("mobile");
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
    status: "optimal" | "acceptable" | "small" | "none";
  }>({
    width: 0,
    height: 0,
    aspectRatio: "",
    status: "none",
  });

  // Determine active storefront image
  const activeImageUrl = form.photo || form.image || "";
  const isCutoutActive =
    Boolean(!form.photo && form.image) ||
    activeImageUrl.includes("cutout") ||
    (activeImageUrl.startsWith("/menu/") && !activeImageUrl.includes("photo"));

  // Detect image dimensions dynamically
  useEffect(() => {
    if (!activeImageUrl) {
      setImageMeta({ width: 0, height: 0, aspectRatio: "", status: "none" });
      return;
    }

    const img = new window.Image();
    img.src = activeImageUrl;
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(w, h);
      const ratioStr = `${Math.round(w / divisor)}:${Math.round(h / divisor)}`;

      let status: "optimal" | "acceptable" | "small" = "acceptable";
      if (w >= 1000 && h >= 700) {
        status = "optimal";
      } else if (w < 600 || h < 400) {
        status = "small";
      }

      setImageMeta({
        width: w,
        height: h,
        aspectRatio: ratioStr,
        status,
      });
    };
    img.onerror = () => {
      setImageMeta({ width: 0, height: 0, aspectRatio: "", status: "none" });
    };
  }, [activeImageUrl]);

  // Current selected category details
  const currentCategory = useMemo(() => {
    if (form.category) {
      return categories.find((c) => c.id === form.category);
    }
    return categories.find((c) => c.slug === form.tag);
  }, [categories, form.category, form.tag]);

  // Construct synthetic ApiMenuItem for DishCard rendering
  const previewItem: ApiMenuItem = useMemo(
    () => ({
      slug: "preview-item",
      name: form.name.trim() || "Classic Buttermilk Stack",
      description:
        form.description.trim() ||
        "Three golden, fluffy pancakes stacked high with organic maple syrup and fresh blueberries.",
      price: form.price ? String(form.price) : "18.00",
      tag: currentCategory?.slug || form.tag || "sweet",
      category_name: currentCategory?.name || "Sweet Favourites",
      category_slug: currentCategory?.slug || form.tag || "sweet",
      category_icon: currentCategory?.icon || "🥞",
      heat: (form.heat as "none" | "medium" | "hot") || "none",
      kcal: null,
      protein_g: null,
      prep_time: "",
      image: form.image || "",
      photo: form.photo || "",
      photos: [],
      is_featured: form.is_featured,
    }),
    [form, currentCategory]
  );

  return (
    <div className="rounded-2xl border border-amber-300/80 bg-linear-to-b from-amber-50/50 via-white to-amber-50/30 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header Strip & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Live Storefront Preview &amp; Sizing Guide
          </h4>
        </div>

        {/* View mode toggle tabs */}
        <div className="inline-flex rounded-xl bg-amber-100/70 p-1 border border-amber-300/60">
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "mobile"
                ? "bg-white text-amber-950 shadow-xs"
                : "text-amber-800/80 hover:text-amber-950"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile Card</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "desktop"
                ? "bg-white text-amber-950 shadow-xs"
                : "text-amber-800/80 hover:text-amber-950"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop Tile</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("guide")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "guide"
                ? "bg-white text-amber-950 shadow-xs"
                : "text-amber-800/80 hover:text-amber-950"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Size Guide</span>
          </button>
        </div>
      </div>

      {/* Sizing & Aspect Ratio Quick Cheatsheet Banner (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 text-zinc-700">
          <span className="font-bold text-amber-900">📐 Ratio:</span>
          <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            4:3 or 1:1
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700">
          <span className="font-bold text-amber-900">🎯 Target:</span>
          <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            1200×900 px
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700">
          <span className="font-bold text-amber-900">🥞 Hero:</span>
          <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            142px tall window
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700">
          <span className="font-bold text-amber-900">📁 Format:</span>
          <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            JPG, WebP, PNG
          </span>
        </div>
      </div>

      {/* Tab 1 & 2: Real-time Live Card Previews */}
      {(viewMode === "mobile" || viewMode === "desktop") && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-amber-900/5 rounded-2xl border border-amber-200/60 overflow-hidden">
            <div className="text-[11px] font-semibold text-amber-900/70 mb-3 flex items-center gap-1.5">
              <span>Customer Storefront Presentation</span>
              <span className="text-zinc-400">•</span>
              <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                {viewMode === "mobile" ? "Mobile View (350px Card)" : "Desktop 4-Up Grid Tile"}
              </span>
            </div>

            {/* The Live Rendered Dish Card */}
            <div
              className={`w-full transition-all duration-300 ${
                viewMode === "mobile"
                  ? "max-w-[360px] preview-phone-card"
                  : "max-w-[310px] preview-desktop-card"
              }`}
            >
              <DishCard
                item={previewItem}
                variant="tile"
                dealBadge={form.is_featured ? "⭐ House Favourite" : undefined}
                onAdd={() => {}}
              />
            </div>
          </div>

          {/* Real-time Diagnostics Strip below Preview */}
          <div className="p-3.5 bg-white rounded-xl border border-zinc-200 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-700">Live Asset:</span>
                <span
                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    isCutoutActive
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isCutoutActive ? <Scissors className="h-3 w-3" /> : <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                  {isCutoutActive ? "Transparent Cutout Sticker" : "Original Photography (Main)"}
                </span>
              </div>

              {/* Quick switch button if both assets exist */}
              {form.photo && form.image && form.photo !== form.image && (
                <button
                  type="button"
                  onClick={() => {
                    if (isCutoutActive) {
                      onSetPhoto?.(form.photo);
                    } else {
                      onSetPhoto?.(form.image);
                    }
                  }}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                >
                  Switch to {isCutoutActive ? "📷 Original Photo" : "✂️ Cutout Sticker"}
                </button>
              )}
            </div>

            {/* Image Resolution & Quality Detection */}
            {imageMeta.width > 0 ? (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 text-[11px]">
                <span className="text-zinc-500">
                  Detected Resolution:{" "}
                  <strong className="text-zinc-800">
                    {imageMeta.width} × {imageMeta.height} px
                  </strong>
                </span>
                <span className="text-zinc-500">
                  Aspect Ratio: <strong className="text-zinc-800">{imageMeta.aspectRatio}</strong>
                </span>
                {imageMeta.status === "optimal" && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Crisp High Resolution (Retina Ready)
                  </span>
                )}
                {imageMeta.status === "acceptable" && (
                  <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <CheckCircle2 className="h-3 w-3" /> Standard Resolution (Good)
                  </span>
                )}
                {imageMeta.status === "small" && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⚠️ Below 800px: May look slightly soft on high-res phone screens
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 italic pt-1">
                No active image uploaded yet. Select or upload a photo below to verify live framing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Visual Sizing & Upload Guide */}
      {viewMode === "guide" && (
        <div className="space-y-4 pt-1">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Guide Card 1: Photography Specs */}
            <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                <span className="h-6 w-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Original Photography (Food Shots)</span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Optimal Aspect Ratio:</strong> 4:3 (Landscape) or 1:1 (Square).
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Target Resolution:</strong> 1200 × 900 px (Min 800 × 600 px).
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Framing &amp; Composition:</strong> Keep pancake stack centered
                    horizontally with 10–15% padding around the plate.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Card Window:</strong> The card anchors the photo into a 142px hero
                    view with 18px top curved corners.
                  </span>
                </li>
              </ul>
            </div>

            {/* Guide Card 2: Transparent Cutouts */}
            <div className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Transparent Cutout Stickers</span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Format:</strong> Transparent PNG or WebP with no background.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Recommended Size:</strong> 800 × 800 px to 1200 × 1200 px.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Automatic Sticker Effect:</strong> The public site automatically
                    applies the white keyline contour drop-shadow!
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>1-Click AI Cutout:</strong> Click the ✂️ Cutout button on any uploaded
                    photo in the gallery to remove the background automatically.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Visual Framing Infographic */}
          <div className="p-4 bg-amber-100/50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Pro Photography Framing Rule:
            </h5>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              When capturing food with your camera or phone, take the shot from a <strong>30°–45° angle</strong> and ensure the plate sits comfortably in the middle. Because our mobile cards feature a <strong>142px hero window</strong> with a clean 38px air gap below the dish name, centered shots fill the entire card width (90%) with maximum appetite appeal!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
