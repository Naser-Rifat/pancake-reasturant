"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  FileText,
  Flame,
  Image as ImageIcon,
  Plus,
  Save,
  Scissors,
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
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import PhotoBoard from "@/components/admin/PhotoBoard";
import DishCard from "@/components/DishCard";
import type { AdminCategory } from "@/lib/admin-api";
import type { ApiMenuItem } from "@/lib/api";
import { EMPTY_FORM, type FormState } from "../_lib";

// The dish create/edit form: self-contained, high-performance editor with
// concurrent preview decoupling so rapid typing and backspacing are instantaneous.
export function MenuDishEditor({
  editing,
  initialForm,
  form: propForm,
  saving,
  closeForm,
  submit,
  pendingPhotos: initialPendingPhotos = [],
  setPhotoCounts,
  formRef,
  photosRef,
  categories = [],
}: {
  editing: string | null;
  initialForm?: FormState;
  form?: FormState;
  saving: boolean;
  closeForm: () => void;
  submit: (formData: FormState, pendingPhotos: string[]) => void;
  pendingPhotos?: string[];
  setPhotoCounts?: Dispatch<SetStateAction<Record<string, number>>>;
  formRef?: RefObject<HTMLDivElement | null>;
  photosRef?: RefObject<HTMLDivElement | null>;
  categories?: AdminCategory[];
  // Legacy / optional props for backwards compatibility
  setForm?: Dispatch<SetStateAction<FormState>>;
  set?: (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  step?: 1 | 2;
  setStep?: Dispatch<SetStateAction<1 | 2>>;
  goToPhotos?: () => void;
  setPendingPhotos?: Dispatch<SetStateAction<string[]>>;
}) {
  // Local state keeps keystrokes and backspaces isolated from parent table re-renders
  const [form, setForm] = useState<FormState>(() => initialForm || propForm || EMPTY_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>(initialPendingPhotos);
  const [activeTab, setActiveTab] = useState<"details" | "photos">("details");
  const [cachedPhoto, setCachedPhoto] = useState<string>("");
  const pristineRef = useRef<FormState>(initialForm || propForm || EMPTY_FORM);

  const { toast } = useToast();
  const { confirm } = useConfirm();

  // React 19 Concurrent Optimization:
  // Inputs & counters respond at 0ms (120 FPS), while the live card preview is deferred
  const deferredForm = useDeferredValue(form);

  useEffect(() => {
    if (form.photo && form.photo !== form.image && !form.photo.includes("-cutout") && !form.photo.includes("cutout.png")) {
      setCachedPhoto(form.photo);
    }
  }, [form.photo, form.image]);

  // Memoized input handler — 0ms keystroke latency
  const set = useCallback(
    (key: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        setForm((prev) => (prev[key] === val ? prev : { ...prev, [key]: val }));
      },
    []
  );

  // Fast word and character count computations
  const { charCount, wordCount, nameCharCount } = useMemo(() => {
    const charCount = form.description.length;
    const trimmed = form.description.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];
    return {
      charCount,
      wordCount: words.length,
      nameCharCount: form.name.length,
    };
  }, [form.description, form.name]);

  // Active category helper (computed against deferred state)
  const activeCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(deferredForm.category) || c.slug === deferredForm.tag),
    [categories, deferredForm.category, deferredForm.tag]
  );

  const isCutoutActive = useMemo(() => Boolean(
    (!deferredForm.photo && deferredForm.image) ||
    (deferredForm.photo && deferredForm.image && deferredForm.photo === deferredForm.image) ||
    (deferredForm.photo && (deferredForm.photo.includes("-cutout") || deferredForm.photo.includes("cutout.png")))
  ), [deferredForm.photo, deferredForm.image]);

  const activeImageUrl = useMemo(() => (
    isCutoutActive
      ? deferredForm.image || deferredForm.photo || ""
      : deferredForm.photo || deferredForm.image || ""
  ), [isCutoutActive, deferredForm.image, deferredForm.photo]);

  // Synthetic item for customer live preview (memoized to prevent child thrashing)
  const previewItem = useMemo<ApiMenuItem>(() => ({
    slug: editing || "preview-dish",
    name: deferredForm.name.trim() || "Classic Buttermilk Stack",
    description:
      deferredForm.description.trim() ||
      "Three fluffy buttermilk pancakes layered with whipped vanilla butter, warm organic maple syrup, and seasonal berries.",
    price: deferredForm.price ? String(deferredForm.price) : "18.00",
    tag: activeCategory?.slug || deferredForm.tag || "sweet",
    category_name: activeCategory?.name || "Sweet Stack",
    category_slug: activeCategory?.slug || deferredForm.tag || "sweet",
    category_icon: activeCategory?.icon || "🥞",
    heat: (deferredForm.heat as "none" | "medium" | "hot") || "none",
    kcal: deferredForm.kcal ? Number(deferredForm.kcal) : null,
    protein_g: deferredForm.protein_g ? Number(deferredForm.protein_g) : null,
    prep_time: deferredForm.prep_time || "",
    image: deferredForm.image || "",
    photo: deferredForm.photo || "",
    photos: [],
    is_featured: deferredForm.is_featured,
  }), [editing, deferredForm, activeCategory]);

  const handleCardAdd = useCallback(() => {}, []);

  const getLatestFormData = useCallback((): FormState => {
    if (typeof document === "undefined") return form;

    const nameEl = document.getElementById("mi-name") as HTMLInputElement | null;
    const priceEl = document.getElementById("mi-price") as HTMLInputElement | null;
    const descEl = document.getElementById("mi-desc") as HTMLTextAreaElement | null;
    const heatEl = document.getElementById("mi-heat") as HTMLSelectElement | null;
    const tagEl = document.getElementById("mi-tag") as HTMLSelectElement | null;

    let nextCategory = form.category;
    let nextTag = form.tag;
    if (tagEl && tagEl.value) {
      const val = tagEl.value;
      const matched = categories.find((c) => String(c.id) === val || c.slug === val);
      if (matched) {
        nextCategory = matched.id;
        nextTag = matched.slug;
      } else {
        nextTag = val;
      }
    }

    return {
      ...form,
      name: nameEl && nameEl.value !== undefined ? nameEl.value : form.name,
      price: priceEl && priceEl.value !== undefined ? priceEl.value : form.price,
      description: descEl && descEl.value !== undefined ? descEl.value : form.description,
      heat: heatEl && heatEl.value !== undefined ? (heatEl.value as "none" | "medium" | "hot") : form.heat,
      tag: nextTag,
      category: nextCategory,
    };
  }, [form, categories]);

  const validate = useCallback((targetForm: FormState): boolean => {
    const missing = (["name", "price", "description"] as const).find((k) => !targetForm[k].trim());
    if (missing) {
      const el = document.getElementById(`mi-${missing === "description" ? "desc" : missing}`);
      el?.focus();
      toast({ variant: "error", title: `Add the ${missing === "description" ? "description" : missing} first` });
      return false;
    }
    const price = Number(targetForm.price);
    if (!Number.isFinite(price) || price < 0) {
      document.getElementById("mi-price")?.focus();
      toast({ variant: "error", title: "Enter a valid price", description: "Numbers only, e.g. 18.50" });
      return false;
    }
    return true;
  }, [toast]);

  const handleGoToPhotos = useCallback(() => {
    const latestForm = getLatestFormData();
    if (!validate(latestForm)) return;
    setForm(latestForm);
    setStep(2);
  }, [getLatestFormData, validate]);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    // If new dish and currently in step 1, advance to photos rather than saving prematurely
    if (!editing && step === 1) {
      handleGoToPhotos();
      return;
    }

    // 1. Force blur on the active element so iOS keyboard commits pending text & composition
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Read live DOM values directly (eliminates iOS Safari async blur/onChange race condition)
    const latestForm = getLatestFormData();

    if (!validate(latestForm)) return;

    setForm(latestForm);
    submit(latestForm, pendingPhotos);
  }, [editing, step, handleGoToPhotos, getLatestFormData, validate, submit, pendingPhotos]);

  const handleClose = useCallback(async () => {
    const dirty = JSON.stringify(pristineRef.current) !== JSON.stringify(form);
    if (dirty) {
      const ok = await confirm({
        title: "Discard unsaved changes?",
        description: "Everything you typed in this form will be lost.",
        confirmLabel: "Discard",
        destructive: true,
      });
      if (!ok) return;
    }
    closeForm();
  }, [confirm, form, closeForm]);

  return (
    <Modal
      open={true}
      onClose={handleClose}
      variant="adaptive"
      size="5xl"
      containerRef={formRef}
      ariaLabel={editing ? form.name || "Edit Dish" : "Create Dish"}
    >
      {/* Sticky Header */}
      <ModalHeader
        onClose={handleClose}
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
        onSubmit={handleSubmit}
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
                        className="border-zinc-300 text-[#211a14] font-bold text-base sm:text-sm h-11 sm:h-10 rounded-xl"
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
                          className="pl-7 border-zinc-300 text-[#211a14] font-bold text-base sm:text-sm h-11 sm:h-10 rounded-xl"
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
                        className="h-11 sm:h-10 text-base sm:text-xs border-zinc-300 font-bold rounded-xl"
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
                        className="h-11 sm:h-10 text-base sm:text-xs border-zinc-300 font-bold rounded-xl"
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

                    {/* Description & Ingredients */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mi-desc" className="text-xs font-semibold text-[#211a14] flex items-center gap-1.5">
                          <span>Description &amp; Ingredients *</span>
                          <span className="text-[10px] font-normal text-zinc-400">(Recommended: 20–35 words)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
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
                        className="border-zinc-300 text-[#211a14] font-medium text-base sm:text-xs rounded-xl focus:border-[#763a12]"
                        placeholder="e.g. Three fluffy buttermilk pancakes layered with whipped vanilla butter, warm organic maple syrup, and seasonal berries."
                        value={form.description}
                        onChange={set("description")}
                      />

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-0.5">
                        <span>
                          {charCount < 40 && "💡 Add key toppings, batter flavor, or allergen notes for diners."}
                          {charCount >= 40 && charCount <= 200 && "✓ Optimal description length for diner menus & cards."}
                          {charCount > 200 && "⚠️ Long descriptions will be clamped to 2 lines on compact cards."}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Max 280 chars</span>
                      </div>
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
                    onCountChange={(slug, count) => setPhotoCounts?.((c) => ({ ...c, [slug]: count }))}
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
                    <Eye className="h-3.5 w-3.5 text-[#763a12]" /> Live Storefront Card
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60">
                  Real-Time Sync
                </span>
              </div>

              <p className="text-[11px] text-zinc-500">
                Updates dynamically as you edit dish details, change prices, or switch food photography.
              </p>

              {/* Render Authentic DishCard Simulation */}
              <div className="flex justify-center py-2">
                <div className="w-full max-w-[320px] preview-phone-card">
                  <DishCard
                    item={previewItem}
                    variant="tile"
                    dealBadge={deferredForm.is_featured ? "⭐ House Favourite" : undefined}
                    onAdd={handleCardAdd}
                  />
                </div>
              </div>

              {/* Live Status Indicators */}
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
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type={!editing && step === 1 ? "button" : "submit"}
            form={!editing && step === 1 ? undefined : "menu-dish-editor-form"}
            loading={saving}
            className="w-full sm:w-auto bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-base sm:text-xs rounded-xl shadow-xs h-12 sm:h-10 px-6 cursor-pointer touch-manipulation"
            onClick={(e) => {
              if (!editing && step === 1) {
                e.preventDefault();
                handleGoToPhotos();
              }
            }}
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
