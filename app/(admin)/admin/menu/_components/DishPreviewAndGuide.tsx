"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Maximize2,
  Monitor,
  Scissors,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Tag,
  Upload,
} from "lucide-react";
import DishCard from "@/components/DishCard";
import type { AdminCategory } from "@/lib/admin-api";
import type { ApiMenuItem } from "@/lib/api";
import {
  evaluateDeviceCompatibility,
  getRatioClassification,
  type DeviceCompatibilityReport,
} from "@/lib/image-validation";
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
  const [viewMode, setViewMode] = useState<"mobile" | "tablet" | "desktop" | "guide">("mobile");
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
    ratioNum: number;
    ratioLabel: string;
    compatibility: DeviceCompatibilityReport | null;
    status: "optimal" | "acceptable" | "small" | "none";
  }>({
    width: 0,
    height: 0,
    aspectRatio: "",
    ratioNum: 0,
    ratioLabel: "",
    compatibility: null,
    status: "none",
  });

  // Determine active storefront image
  const isCutoutActive = Boolean(
    (!form.photo && Boolean(form.image)) ||
    (form.photo && form.image && form.photo === form.image) ||
    (form.photo && (form.photo.includes("-cutout") || form.photo.includes("cutout.png"))) ||
    (form.image && !form.photo)
  );
  const activeImageUrl = isCutoutActive ? form.image || form.photo : form.photo || form.image || "";

  // Detect image dimensions & evaluate multi-device compatibility dynamically
  useEffect(() => {
    if (!activeImageUrl) {
      setImageMeta({
        width: 0,
        height: 0,
        aspectRatio: "",
        ratioNum: 0,
        ratioLabel: "",
        compatibility: null,
        status: "none",
      });
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
      const ratioNum = w / h;

      const classification = getRatioClassification(ratioNum);
      const compatibility = evaluateDeviceCompatibility(w, h, ratioNum);

      let status: "optimal" | "acceptable" | "small" = "acceptable";
      if (w >= 1000 && h >= 750) {
        status = "optimal";
      } else if (w < 600 || h < 400) {
        status = "small";
      }

      setImageMeta({
        width: w,
        height: h,
        aspectRatio: ratioStr,
        ratioNum,
        ratioLabel: classification.label,
        compatibility,
        status,
      });
    };
    img.onerror = () => {
      setImageMeta({
        width: 0,
        height: 0,
        aspectRatio: "",
        ratioNum: 0,
        ratioLabel: "",
        compatibility: null,
        status: "none",
      });
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
      is_active: true,
      allergens: [],
      tags: [],
    }),
    [form, currentCategory]
  );

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsExpanded(true);
    }
  }, []);

  return (
    <div className="rounded-2xl border border-amber-300/80 bg-linear-to-b from-amber-50/50 via-white to-amber-50/30 p-3.5 sm:p-5 shadow-xs space-y-3">
      {/* Header Strip & Collapsible Toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        className="flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 truncate">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Live Storefront Preview &amp; Sizing</span>
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300/60 hidden sm:inline-block">
            {isExpanded ? "Tap to minimize" : "Tap to inspect"}
          </span>
          <span className={`text-xs text-amber-800 font-bold transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-amber-200/60">
          {/* View mode toggle tabs: Mobile, Tablet (iPad), Desktop, Guide */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full rounded-xl bg-amber-100/70 p-1 border border-amber-300/60">
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                viewMode === "mobile"
                  ? "bg-white text-amber-950 shadow-xs"
                  : "text-amber-800/80 hover:text-amber-950"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tablet")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                viewMode === "tablet"
                  ? "bg-white text-amber-950 shadow-xs"
                  : "text-amber-800/80 hover:text-amber-950"
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Tablet<span className="hidden sm:inline"> (iPad)</span></span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                viewMode === "desktop"
                  ? "bg-white text-amber-950 shadow-xs"
                  : "text-amber-800/80 hover:text-amber-950"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("guide")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                viewMode === "guide"
                  ? "bg-white text-amber-950 shadow-xs"
                  : "text-amber-800/80 hover:text-amber-950"
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span><span className="hidden sm:inline">Device </span>Matrix</span>
            </button>
          </div>

          {/* Sizing & Aspect Ratio Quick Cheatsheet Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-zinc-700 min-w-0">
              <span className="font-bold text-amber-900 shrink-0">📱 Mobile:</span>
              <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                4:3 / 1:1
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-700 min-w-0">
              <span className="font-bold text-amber-900 shrink-0">📱 Tablet:</span>
              <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                2-Col Grid
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-700 min-w-0">
              <span className="font-bold text-amber-900 shrink-0">💻 Desktop:</span>
              <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                4-Col Grid
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-700 min-w-0">
              <span className="font-bold text-amber-900 shrink-0">🎯 Standard:</span>
              <span className="font-medium text-zinc-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                1200×900 px
              </span>
            </div>
          </div>

      {/* Real-time Live Card Previews for Mobile, Tablet, Desktop */}
      {viewMode !== "guide" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-amber-900/5 rounded-2xl border border-amber-200/60 overflow-hidden">
            <div className="text-[11px] font-semibold text-amber-900/70 mb-3 flex items-center gap-1.5">
              <span>Customer Storefront Presentation</span>
              <span className="text-zinc-400">•</span>
              <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                {viewMode === "mobile"
                  ? "📱 Mobile Smartphone View (375px Single Column)"
                  : viewMode === "tablet"
                  ? "📱 iPad / Tablet View (768px 2-Col Grid)"
                  : "💻 Desktop View (1200px 4-Up Grid Tile)"}
              </span>
            </div>

            {/* Viewport Simulation: Mobile (360px card) */}
            {viewMode === "mobile" && (
              <div className="w-full max-w-[360px] preview-phone-card transition-all duration-300">
                <DishCard
                  item={previewItem}
                  variant="tile"
                  dealBadge={form.is_featured ? "⭐ House Favourite" : undefined}
                  onAdd={() => {}}
                />
              </div>
            )}

            {/* Viewport Simulation: Tablet (iPad 2-Col Grid) */}
            {viewMode === "tablet" && (
              <div className="w-full max-w-[640px] transition-all duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold text-amber-900/60 mb-1">
                      Current Dish Preview
                    </div>
                    <div className="preview-phone-card">
                      <DishCard
                        item={previewItem}
                        variant="tile"
                        dealBadge={form.is_featured ? "⭐ House Favourite" : undefined}
                        onAdd={() => {}}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-amber-900/60 mb-1">
                      Adjacent Card Comparison
                    </div>
                    <div className="preview-phone-card">
                      <DishCard
                        item={{
                          ...previewItem,
                          slug: "preview-adjacent",
                          name: "Wild Berry Belgian Waffle",
                          price: "16.50",
                          tag: "sweet",
                          photo: "/menu/buttermilk.png",
                          image: "",
                        }}
                        variant="tile"
                        onAdd={() => {}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Viewport Simulation: Desktop (310px Boutique Diner Tile) */}
            {viewMode === "desktop" && (
              <div className="w-full max-w-[310px] preview-desktop-card transition-all duration-300">
                <DishCard
                  item={previewItem}
                  variant="tile"
                  dealBadge={form.is_featured ? "⭐ House Favourite" : undefined}
                  onAdd={() => {}}
                />
              </div>
            )}
          </div>

          {/* Real-time Diagnostics Strip below Preview */}
          <div className="p-3.5 bg-white rounded-xl border border-zinc-200 space-y-2.5 text-xs">
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
              {form.photo && form.image && (
                <button
                  type="button"
                  onClick={() => {
                    if (isCutoutActive) {
                      onSetPhoto?.(form.photo === form.image ? "" : form.photo);
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
              <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-[11px]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-zinc-500">
                    Resolution:{" "}
                    <strong className="text-zinc-800 font-mono">
                      {imageMeta.width} × {imageMeta.height} px
                    </strong>
                  </span>
                  <span className="text-zinc-500">
                    Aspect Ratio:{" "}
                    <strong className="text-zinc-800 font-mono">
                      {imageMeta.aspectRatio} ({imageMeta.ratioLabel})
                    </strong>
                  </span>
                  {imageMeta.compatibility && (
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[10px] ${
                        imageMeta.compatibility.retinaScore.startsWith("Retina")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : imageMeta.compatibility.retinaScore === "Standard HD"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {imageMeta.compatibility.retinaScore}
                    </span>
                  )}
                </div>

                {/* Device Compatibility Matrix Badges */}
                {imageMeta.compatibility && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-800 flex items-center gap-1 text-[11px]">
                          <Smartphone className="h-3 w-3 text-amber-700" /> Mobile (375px)
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider ${
                            imageMeta.compatibility.mobile.rating === "Optimal"
                              ? "bg-emerald-100 text-emerald-800"
                              : imageMeta.compatibility.mobile.rating === "Good"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {imageMeta.compatibility.mobile.rating}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        {imageMeta.compatibility.mobile.detail}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-800 flex items-center gap-1 text-[11px]">
                          <Tablet className="h-3 w-3 text-amber-700" /> Tablet (768px)
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider ${
                            imageMeta.compatibility.tablet.rating === "Optimal"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {imageMeta.compatibility.tablet.rating}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        {imageMeta.compatibility.tablet.detail}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-800 flex items-center gap-1 text-[11px]">
                          <Monitor className="h-3 w-3 text-amber-700" /> Desktop (1200px)
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider ${
                            imageMeta.compatibility.desktop.rating === "Optimal"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {imageMeta.compatibility.desktop.rating}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        {imageMeta.compatibility.desktop.detail}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 italic pt-1">
                No active image uploaded yet. Select or upload a photo below to verify live framing across Mobile, Tablet, and Desktop.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Visual Sizing & Upload Guide with Multi-Device Matrix */}
      {viewMode === "guide" && (
        <div className="space-y-4 pt-1">
          {/* Multi-Device Harmony Spec Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                <Smartphone className="h-4 w-4 text-amber-700" />
                <span>Mobile (iPhone / Android)</span>
              </div>
              <ul className="text-[11px] text-zinc-600 space-y-1">
                <li>• <strong>Screen Width:</strong> 375px – 430px</li>
                <li>• <strong>Container:</strong> 340px – 360px single card</li>
                <li>• <strong>Hero Window:</strong> 142px height</li>
                <li>• <strong>Recommended:</strong> 4:3 (Landscape) or 1:1</li>
                <li>• <strong>Retina Density:</strong> 2x / 3x Super Retina</li>
              </ul>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                <Tablet className="h-4 w-4 text-amber-700" />
                <span>Tablet (iPad / Android Tablet)</span>
              </div>
              <ul className="text-[11px] text-zinc-600 space-y-1">
                <li>• <strong>Screen Width:</strong> 768px – 1024px</li>
                <li>• <strong>Container:</strong> 2-col / 3-col grid</li>
                <li>• <strong>Card Width:</strong> ~320px – 360px</li>
                <li>• <strong>Recommended:</strong> 4:3, 1:1, or 3:2</li>
                <li>• <strong>Retina Density:</strong> 2x Liquid Retina</li>
              </ul>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                <Monitor className="h-4 w-4 text-amber-700" />
                <span>Desktop (Laptops &amp; 4K Displays)</span>
              </div>
              <ul className="text-[11px] text-zinc-600 space-y-1">
                <li>• <strong>Screen Width:</strong> 1200px – 1920px+</li>
                <li>• <strong>Container:</strong> 4-column diner catalog</li>
                <li>• <strong>Card Width:</strong> 280px – 310px</li>
                <li>• <strong>Recommended:</strong> 4:3 or 1:1 (Retina Crisp)</li>
                <li>• <strong>Retina Density:</strong> 1x / 2x Desktop Retina</li>
              </ul>
            </div>
          </div>

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
                    <strong>Target Resolution:</strong> 1200 × 900 px (Strict floor: 500 × 400 px).
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Strict 5 MB Ceiling:</strong> Files over 5 MB are automatically rejected to protect mobile page speed.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Framing &amp; Composition:</strong> Keep pancake stack centered horizontally with 10–15% breathing room around the plate.
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
                    <strong>Automatic Sticker Effect:</strong> The public site automatically applies the white keyline contour drop-shadow!
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>1-Click AI Cutout:</strong> Click the ✂️ Cutout button on any uploaded photo in the gallery to remove the background automatically.
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
              When capturing food with your camera or phone, take the shot from a <strong>30°–45° angle</strong> and ensure the plate sits comfortably in the middle. Because our mobile and desktop cards feature a <strong>142px hero window</strong>, centered shots fill the entire card width (90%) with maximum appetite appeal and zero awkward cropping!
            </p>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
