"use client";

import { useEffect, useState, type ChangeEvent, type Dispatch, type FormEvent, type RefObject, type SetStateAction } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Flame,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutGrid,
  Maximize2,
  Plus,
  Save,
  Scissors,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PhotoBoard from "@/components/admin/PhotoBoard";
import DishCard from "@/components/DishCard";
import type { AdminCategory } from "@/lib/admin-api";
import type { ApiMenuItem } from "@/lib/api";
import type { FormState } from "../_lib";

// The dish create/edit form: a 2-step wizard for new dishes (details → photos)
// and an elegant tabbed editor for existing catalog items.
export function MenuDishEditor({
  editing,
  form,
  setForm,
  set,
  step,
  setStep,
  saving,
  closeForm,
  submit,
  goToPhotos,
  pendingPhotos,
  setPendingPhotos,
  setPhotoCounts,
  formRef,
  photosRef,
  categories = [],
}: {
  editing: string | null;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  set: (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  step: 1 | 2;
  setStep: Dispatch<SetStateAction<1 | 2>>;
  saving: boolean;
  closeForm: () => void;
  submit: (e?: FormEvent) => void;
  goToPhotos: () => void;
  pendingPhotos: string[];
  setPendingPhotos: Dispatch<SetStateAction<string[]>>;
  setPhotoCounts: Dispatch<SetStateAction<Record<string, number>>>;
  formRef: RefObject<HTMLDivElement | null>;
  photosRef: RefObject<HTMLDivElement | null>;
  categories?: AdminCategory[];
}) {
  const [activeTab, setActiveTab] = useState<"details" | "photos">("details");
  const [cachedPhoto, setCachedPhoto] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"card" | "detail">("card");

  useEffect(() => {
    if (form.photo && form.photo !== form.image && !form.photo.includes("-cutout") && !form.photo.includes("cutout.png")) {
      setCachedPhoto(form.photo);
    }
  }, [form.photo, form.image]);

  const isCutoutActive = Boolean(
    (!form.photo && form.image) ||
    (form.photo && form.image && form.photo === form.image) ||
    (form.photo && (form.photo.includes("-cutout") || form.photo.includes("cutout.png")))
  );

  const activeImageUrl = isCutoutActive
    ? form.image || form.photo || ""
    : form.photo || form.image || "";

  // Active category helper
  const activeCategory = categories.find(
    (c) => String(c.id) === String(form.category) || c.slug === form.tag
  );

  // Word and character count computations
  const charCount = form.description.length;
  const trimmedDesc = form.description.trim();
  const words = trimmedDesc ? trimmedDesc.split(/\s+/) : [];
  const wordCount = words.length;
  const nameCharCount = form.name.length;

  // Split description: First ~20 words fit into 2 lines on the Menu Grid Card
  const CARD_WORD_LIMIT = 20;
  const cardWords = words.slice(0, CARD_WORD_LIMIT).join(" ");
  const overflowWords = words.length > CARD_WORD_LIMIT ? words.slice(CARD_WORD_LIMIT).join(" ") : "";

  // Synthetic item for customer live preview
  const previewItem: ApiMenuItem = {
    slug: editing || "preview-dish",
    name: form.name.trim() || "Classic Buttermilk Stack",
    description:
      form.description.trim() ||
      "Three fluffy buttermilk pancakes layered with whipped vanilla butter, warm organic maple syrup, and seasonal berries.",
    price: form.price ? String(form.price) : "18.00",
    tag: activeCategory?.slug || form.tag || "sweet",
    category_name: activeCategory?.name || "Sweet Stack",
    category_slug: activeCategory?.slug || form.tag || "sweet",
    category_icon: activeCategory?.icon || "🥞",
    heat: (form.heat as "none" | "medium" | "hot") || "none",
    kcal: form.kcal ? Number(form.kcal) : null,
    protein_g: form.protein_g ? Number(form.protein_g) : null,
    prep_time: form.prep_time || "",
    image: form.image || "",
    photo: form.photo || "",
    photos: [],
    is_featured: form.is_featured,
  };

  return (
    <Modal
      open={true}
      onClose={closeForm}
      variant="adaptive"
      size="5xl"
      containerRef={formRef}
      ariaLabel={editing ? form.name || "Edit Dish" : "Create Dish"}
    >
      {/* Sticky Header */}
      <ModalHeader
        onClose={closeForm}
        title={
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-[#211a14] truncate">
              {editing ? form.name || "Edit Dish" : step === 1 ? "New Dish — Details" : "New Dish — Photos"}
            </span>
            {editing && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 hidden sm:inline-block">
                Catalog Item
              </span>
            )}
          </div>
        }
        description={
          editing ? (
            <span className="text-xs text-zinc-500 font-medium">
              {activeCategory?.name ? `${activeCategory.icon || "🥞"} ${activeCategory.name}` : "Menu Item"} · {form.price ? `$${form.price} AUD` : "Unpriced"}
            </span>
          ) : (
            <span className="text-xs text-zinc-500 font-medium">
              Step {step} of 2 · {step === 1 ? "Basic Details" : "Photos & Sizing"}
            </span>
          )
        }
      />

      {/* Tab Switcher for Existing Dishes */}
      {editing && (
        <div className="px-4 sm:px-6 pt-2 bg-zinc-50/90 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === "details"
                  ? "border-[#763a12] text-[#763a12] bg-white shadow-2xs font-extrabold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span>Dish Information</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === "photos"
                  ? "border-[#763a12] text-[#763a12] bg-white shadow-2xs font-extrabold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Photos &amp; Storefront</span>
              {Boolean(form.photo || form.image) && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Form Body with Side-by-Side Split on Desktop */}
      <form
        id="menu-dish-editor-form"
        onSubmit={submit}
        className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields & Photos (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tab 1: Core Details (or Step 1 for new dish) */}
            {((!editing && step === 1) || (editing && activeTab === "details")) && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5" /> Menu Dish Essentials:
                  </span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Dish Name with live character counter */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mi-name" className="text-xs font-semibold text-[#211a14] flex items-center gap-1.5">
                          <span>Dish Name *</span>
                          <span className="text-[10px] font-normal text-zinc-400">(Public Menu Title)</span>
                        </Label>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${nameCharCount > 50 ? "bg-amber-50 text-amber-800 border border-amber-200" : "text-zinc-400"}`}>
                          {nameCharCount} / 60 chars
                        </span>
                      </div>
                      <Input
                        id="mi-name"
                        required
                        maxLength={60}
                        className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                        placeholder="e.g. Classic Golden Buttermilk Stack"
                        value={form.name}
                        onChange={set("name")}
                      />
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 px-0.5">
                        <span>
                          {nameCharCount > 45
                            ? "⚠️ Long name: may wrap to 2 lines on smaller mobile screens."
                            : "💡 Tip: 15–35 chars recommended for clean single-line display."}
                        </span>
                        <span className="text-zinc-400 font-mono">Max 60</span>
                      </div>
                    </div>

                    {/* Price with Currency Adornment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mi-price" className="text-xs font-semibold text-[#211a14]">
                          Price ($ AUD) *
                        </Label>
                        <span className="text-[10px] text-zinc-400 font-medium">Incl. GST</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                          $
                        </span>
                        <Input
                          id="mi-price"
                          required
                          inputMode="decimal"
                          className="pl-7 border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                          placeholder="18.50"
                          value={form.price}
                          onChange={set("price")}
                        />
                      </div>
                    </div>

                    {/* Spice / Heat Badge */}
                    <div className="space-y-1.5">
                      <Label htmlFor="mi-heat" className="text-xs font-semibold text-[#211a14]">
                        Spice / Heat Badge
                      </Label>
                      <Select
                        id="mi-heat"
                        className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                        value={form.heat}
                        onChange={set("heat")}
                      >
                        <option value="none">Mild / No Heat</option>
                        <option value="medium">🌶️ Medium Heat</option>
                        <option value="hot">🔥 Hot &amp; Spicy</option>
                      </Select>
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mi-tag" className="text-xs font-semibold text-[#211a14]">
                          Category *
                        </Label>
                        <Link
                          href="/admin/categories"
                          target="_blank"
                          className="text-[10px] text-amber-800 hover:underline font-semibold"
                        >
                          Manage Categories ↗
                        </Link>
                      </div>
                      <Select
                        id="mi-tag"
                        className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                        value={form.category ? String(form.category) : form.tag}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = categories.find((c) => String(c.id) === val || c.slug === val);
                          if (matched) {
                            setForm((prev) => ({ ...prev, category: matched.id, tag: matched.slug }));
                          } else {
                            set("tag")(e);
                          }
                        }}
                      >
                        {categories.length > 0 ? (
                          categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon || "🥞"} {c.name} {c.is_active ? "" : "(Hidden)"}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="sweet">🍯 Sweet Stack</option>
                            <option value="savoury">🥑 Savoury Brunch</option>
                            <option value="choc">🍫 Choc Loaded</option>
                          </>
                        )}
                      </Select>
                    </div>

                    {/* Description & Ingredients with Public Website Visibility Guide & Live Breakdown */}
                    <div className="space-y-2.5 sm:col-span-2 pt-1">
                      {/* Explainer Box: Public Website Visibility Guide */}
                      <div className="rounded-xl border border-amber-200/90 bg-linear-to-r from-amber-50/90 via-orange-50/40 to-amber-50/80 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#763a12] flex items-center gap-1.5">
                            <Info className="h-4 w-4 text-amber-700 shrink-0" /> Public Website Visibility Guide
                          </span>
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 border border-amber-300/60 px-2 py-0.5 rounded-full">
                            Standard: Max 280 chars (~45-50 words)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white/95 rounded-xl p-2.5 border border-amber-100/90 shadow-2xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                              <Smartphone className="h-3.5 w-3.5 text-amber-800 shrink-0" />
                              <span>1. Menu Grid Card (Browse)</span>
                            </div>
                            <p className="text-[10.5px] text-zinc-600 leading-snug">
                              Shows the <strong className="text-zinc-900">first ~18–22 words (2 lines)</strong> with automatic ellipsis (<code className="text-[9.5px] bg-zinc-100 px-1 rounded">...</code>). Keeps the customer grid neat and fast to browse.
                            </p>
                          </div>

                          <div className="bg-white/95 rounded-xl p-2.5 border border-amber-100/90 shadow-2xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                              <Maximize2 className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                              <span>2. Full Dish Page (Click/Modal)</span>
                            </div>
                            <p className="text-[10.5px] text-zinc-600 leading-snug">
                              Shows <strong className="text-emerald-800">100% of your full text</strong> (all ingredients, tasting notes &amp; toppings) when a customer taps the dish to view or order.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header with dual Word and Character counters */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mi-desc" className="text-xs font-semibold text-[#211a14] flex items-center gap-1.5">
                          <span>Description &amp; Ingredients *</span>
                          <span className="text-[10px] font-normal text-zinc-400">(Recommended: 20–35 words)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-600 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                            {wordCount} {wordCount === 1 ? "word" : "words"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              charCount >= 280
                                ? "bg-red-50 text-red-700 border-red-200"
                                : charCount > 230
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200"
                            }`}
                          >
                            {charCount} / 280 chars
                          </span>
                        </div>
                      </div>

                      <Textarea
                        id="mi-desc"
                        required
                        maxLength={280}
                        rows={3}
                        className="border-zinc-300 text-[#211a14] font-medium text-xs rounded-xl focus:border-[#763a12]"
                        placeholder="e.g. Three fluffy buttermilk pancakes layered with whipped vanilla butter, warm organic maple syrup, and seasonal berries."
                        value={form.description}
                        onChange={set("description")}
                      />

                      {/* Live Excerpt Breakdown: Shows user exact split between Card and Details Page */}
                      {wordCount > 0 && (
                        <div className="bg-zinc-50/90 border border-zinc-200 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                            <span className="flex items-center gap-1 text-[#763a12]">
                              <Layers className="h-3 w-3 text-amber-800" /> Live Text Breakdown:
                            </span>
                            <span className="text-zinc-400 font-normal">
                              {overflowWords ? `${words.length} words total` : "Fits completely on card & page"}
                            </span>
                          </div>

                          <div className="text-zinc-700 leading-relaxed text-[11px] bg-white p-2 rounded-lg border border-zinc-200/70">
                            <span className="bg-amber-100/90 text-amber-950 font-bold px-1 py-0.5 rounded" title="This part appears on the Menu Grid Card">
                              {cardWords}
                            </span>
                            {overflowWords && (
                              <span className="text-zinc-400 ml-1 font-normal" title="This part appears on the Full Dish Page">
                                {" "}{overflowWords} <span className="inline-block text-[9.5px] text-zinc-400 font-sans italic">(Visible in detail view)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-500 pt-0.5">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                              <span>Highlighted = Menu Grid Card (First 2 lines)</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-zinc-300 inline-block" />
                              <span>Remaining = Full Dish Page</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Length Guidance Meter */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-0.5">
                        <span>
                          {wordCount === 0 && "💡 Add key toppings, batter flavor, or allergen notes for diners."}
                          {wordCount > 0 && wordCount <= 12 && "🟡 Brief — Consider mentioning ingredients or toppings."}
                          {wordCount > 12 && wordCount <= 35 && "✓ Perfect length! Appetizing on cards and rich on the details page."}
                          {wordCount > 35 && "🔵 Rich storytelling — First 2 lines appear on card; full text on details page."}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {280 - charCount} left
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kitchen & Nutrition Specs (Standard Restaurant Fields) */}
                <div className="pt-4 border-t border-zinc-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Kitchen &amp; Nutrition Specs (Optional):
                    </span>
                    <span className="text-[10px] text-zinc-400">Diner menu badges</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="mi-prep" className="text-[11px] font-semibold text-zinc-600">
                        Prep Time
                      </Label>
                      <Input
                        id="mi-prep"
                        className="border-zinc-300 text-xs h-9 rounded-xl"
                        placeholder="e.g. 10-15 mins"
                        value={form.prep_time}
                        onChange={set("prep_time")}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="mi-kcal" className="text-[11px] font-semibold text-zinc-600">
                        Calories (kcal)
                      </Label>
                      <Input
                        id="mi-kcal"
                        type="number"
                        min="0"
                        max="9999"
                        className="border-zinc-300 text-xs h-9 rounded-xl"
                        placeholder="e.g. 520"
                        value={form.kcal}
                        onChange={set("kcal")}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="mi-protein" className="text-[11px] font-semibold text-zinc-600">
                        Protein (grams)
                      </Label>
                      <Input
                        id="mi-protein"
                        type="number"
                        min="0"
                        max="999"
                        className="border-zinc-300 text-xs h-9 rounded-xl"
                        placeholder="e.g. 14"
                        value={form.protein_g}
                        onChange={set("protein_g")}
                      />
                    </div>
                  </div>
                </div>

                {/* Visibility & Storefront Controls */}
                <div className="pt-4 border-t border-zinc-200/80 space-y-3">
                  <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Visibility &amp; Display:
                  </span>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-[#211a14]">Available on Menu</div>
                        <div className="text-[11px] text-zinc-500">Visible to customers &amp; orderable</div>
                      </div>
                      <Switch
                        checked={form.is_available}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, is_available: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-[#211a14]">Featured on Homepage</div>
                        <div className="text-[11px] text-zinc-500">Highlighted in hero carousel</div>
                      </div>
                      <Switch
                        checked={form.is_featured}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Photos & Storefront Asset (or Step 2 for new dish) */}
            {((!editing && step === 2) || (editing && activeTab === "photos")) && (
              <div className="space-y-6">
                {/* Storefront Asset Style Switcher (if both photo and cutout exist) */}
                {form.photo && form.image && (
                  <div className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#211a14] shrink-0">Storefront Style:</span>
                      <div className="inline-flex rounded-xl bg-white p-1 border border-zinc-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            const target = cachedPhoto || form.photo;
                            if (target) setForm((f) => ({ ...f, photo: target }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            !isCutoutActive
                              ? "bg-[#763a12] text-white shadow-2xs"
                              : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          <span>📷 Framed Photography</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (form.image) setForm((f) => ({ ...f, photo: form.image }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCutoutActive
                              ? "bg-emerald-700 text-white shadow-2xs"
                              : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          <Scissors className="h-3 w-3" />
                          <span>Cutout Sticker</span>
                        </button>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-600 font-medium">
                      {isCutoutActive
                        ? "✓ Cutout sticker active on cards"
                        : "✓ Full photography active on cards"}
                    </span>
                  </div>
                )}

                {/* Photo Library & Upload Board */}
                <div ref={photosRef}>
                  <PhotoBoard
                    slug={editing ?? ""}
                    name={form.name || "this dish"}
                    mainUrl={form.photo}
                    cutoutUrl={form.image}
                    onSetMain={(url) => setForm((f) => ({ ...f, photo: url }))}
                    onSetCutout={(url) => setForm((f) => ({ ...f, image: url }))}
                    onCountChange={(slug, count) => setPhotoCounts((c) => ({ ...c, [slug]: count }))}
                    pending={pendingPhotos}
                    onPendingChange={setPendingPhotos}
                  />
                </div>

                {/* For new dishes in Step 2: Show Availability Controls */}
                {!editing && (
                  <div className="pt-4 border-t border-zinc-200/80 space-y-3">
                    <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Visibility &amp; Publishing:
                    </span>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white">
                        <div>
                          <div className="text-xs font-bold text-[#211a14]">Available on Menu</div>
                          <div className="text-[11px] text-zinc-500">Visible to customers &amp; orderable</div>
                        </div>
                        <Switch
                          checked={form.is_available}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, is_available: v }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white">
                        <div>
                          <div className="text-xs font-bold text-[#211a14]">Featured on Homepage</div>
                          <div className="text-[11px] text-zinc-500">Highlighted in hero carousel</div>
                        </div>
                        <Switch
                          checked={form.is_featured}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Real-Time Live Preview Pane (lg:col-span-5) */}
          <div className="lg:col-span-5 lg:sticky lg:top-0 space-y-4">
            <div className="rounded-2xl border border-zinc-200/90 bg-linear-to-b from-zinc-50/80 via-white to-amber-50/20 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold text-[#211a14] uppercase tracking-wide flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-[#763a12]" /> Customer Live Preview
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60">
                  Real-Time Sync
                </span>
              </div>

              {/* Segmented Dual View Switcher: Card vs Full Details */}
              <div className="bg-zinc-200/80 p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("card")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    previewMode === "card"
                      ? "bg-white text-[#763a12] shadow-xs font-extrabold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Menu Grid Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("detail")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    previewMode === "detail"
                      ? "bg-white text-[#763a12] shadow-xs font-extrabold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Dish Page</span>
                </button>
              </div>

              {/* Preview Display Mode 1: Menu Grid Card */}
              {previewMode === "card" && (
                <div className="space-y-2">
                  <div className="flex justify-center py-1">
                    <div className="w-full max-w-[320px] preview-phone-card">
                      <DishCard
                        item={previewItem}
                        variant="tile"
                        dealBadge={form.is_featured ? "⭐ House Favourite" : undefined}
                        onAdd={() => {}}
                      />
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[10.5px] text-zinc-600 flex items-start gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-amber-800 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-900">Menu Grid View:</strong> Shows title, price, badges, and first ~18–22 words. Kept uniform with ellipsis (<code className="bg-white px-1 rounded">...</code>) so mobile grids scroll smoothly.
                    </span>
                  </div>
                </div>
              )}

              {/* Preview Display Mode 2: Full Customer Dish Details Modal/Page */}
              {previewMode === "detail" && (
                <div className="space-y-2">
                  <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-3.5 space-y-3">
                    {/* Visual Asset Box */}
                    <div className="relative aspect-16/10 w-full rounded-lg overflow-hidden bg-amber-50/50 flex items-center justify-center border border-zinc-100">
                      {activeImageUrl ? (
                        <Image
                          src={activeImageUrl}
                          alt={previewItem.name}
                          fill
                          className={isCutoutActive ? "object-contain p-3 drop-shadow-md" : "object-cover"}
                          unoptimized
                        />
                      ) : (
                        <span className="text-3xl">🥞</span>
                      )}
                      {form.is_featured && (
                        <span className="absolute top-2 left-2 bg-[#763a12] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          ✨ House Favourite
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {isCutoutActive ? "✂️ Cutout Sticker" : "📷 Full Photo"}
                      </span>
                    </div>

                    {/* Dish Metadata & Price */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {previewItem.category_icon} {previewItem.category_name}
                        </span>
                        <span className="text-sm font-black text-[#763a12]">
                          ${form.price ? form.price : "18.00"} AUD
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-zinc-900 leading-snug">
                        {form.name.trim() || "Classic Golden Buttermilk Stack"}
                        {form.heat === "medium" && <span className="ml-1 text-xs" title="Medium Heat">🌶️</span>}
                        {form.heat === "hot" && <span className="ml-1 text-xs" title="Hot &amp; Spicy">🔥</span>}
                      </h4>

                      {/* 100% Full Unclamped Description */}
                      <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
                          <span>Full Customer Description</span>
                          <span className="text-emerald-700 font-semibold bg-white/80 px-1.5 py-0.5 rounded">
                            ✓ 100% Visible to Diners
                          </span>
                        </div>
                        <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                          {form.description.trim() || "Three fluffy buttermilk pancakes layered with whipped vanilla butter, warm organic maple syrup, and seasonal berries."}
                        </p>
                      </div>

                      {/* Kitchen Badges */}
                      {(form.prep_time || form.kcal || form.protein_g || form.heat !== "none") && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {form.prep_time && (
                            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200">
                              ⏱️ {form.prep_time}
                            </span>
                          )}
                          {form.kcal && (
                            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200">
                              🔥 {form.kcal} kcal
                            </span>
                          )}
                          {form.protein_g && (
                            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200">
                              💪 {form.protein_g}g prot
                            </span>
                          )}
                          {form.heat === "medium" && (
                            <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                              🌶️ Medium Heat
                            </span>
                          )}
                          {form.heat === "hot" && (
                            <span className="text-[10px] font-semibold bg-red-100 text-red-900 px-2 py-0.5 rounded-full border border-red-200">
                              🔥 Hot &amp; Spicy
                            </span>
                          )}
                        </div>
                      )}

                      {/* Mock Add to Order CTA */}
                      <div className="pt-1.5">
                        <div className="w-full bg-[#763a12] text-white text-xs font-bold py-2 rounded-xl text-center shadow-xs flex items-center justify-center gap-1.5 opacity-95">
                          <span>Add to Order — ${form.price ? form.price : "18.00"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-[10.5px] text-zinc-600 flex items-start gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5 text-emerald-800 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-900">Dish Detail Page:</strong> When diners tap on this dish to order, they see your complete 280-char description, all ingredients &amp; culinary details without any truncation.
                    </span>
                  </div>
                </div>
              )}

              {/* Live Status & Nutritional Matrix */}
              <div className="space-y-2 pt-2 border-t border-zinc-200/80">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white rounded-lg p-2.5 border border-zinc-100 shadow-2xs flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Storefront Asset</span>
                    <span className="font-bold text-zinc-800 truncate mt-0.5">
                      {isCutoutActive ? "✂️ Cutout Sticker" : "📷 Full Photo"}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-zinc-100 shadow-2xs flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Ordering Status</span>
                    <span className={`font-bold mt-0.5 truncate ${form.is_available ? "text-emerald-700" : "text-amber-700"}`}>
                      {form.is_available ? "✓ Open for Orders" : "⏸ Paused / Hidden"}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-zinc-100 shadow-2xs flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Kitchen &amp; Spice</span>
                    <span className="font-bold text-zinc-800 truncate mt-0.5">
                      {form.heat === "hot" ? "🔥 Spicy" : form.heat === "medium" ? "🌶️ Medium" : "Mild"} · {form.prep_time || "10-15m"}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-zinc-100 shadow-2xs flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Nutrition</span>
                    <span className="font-bold text-zinc-800 truncate mt-0.5">
                      {form.kcal ? `${form.kcal} kcal` : "No kcal"} · {form.protein_g ? `${form.protein_g}g` : "No prot."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Bottom Action Bar */}
      <ModalFooter>
        <div className="text-xs text-zinc-500 font-medium hidden sm:flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{!editing ? `Step ${step} of 2` : "All changes save to live menu"}</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {!editing && step === 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-300 text-[#763a12] text-xs font-bold rounded-xl h-11 sm:h-10 px-4 cursor-pointer"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-zinc-600 rounded-xl h-10 px-3 cursor-pointer hidden sm:inline-flex"
            onClick={closeForm}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={saving}
            className="w-full sm:w-auto bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-sm sm:text-xs rounded-xl shadow-xs h-11 sm:h-10 px-6 cursor-pointer"
            onClick={() => (!editing && step === 1 ? goToPhotos() : submit())}
          >
            {!editing && step === 1 ? (
              <>
                <span>Next: Upload Photos</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            ) : editing ? (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                <span>{saving ? "Adding to Menu..." : "Add to Menu"}</span>
              </>
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
