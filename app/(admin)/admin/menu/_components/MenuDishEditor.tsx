import { useEffect, useState, type ChangeEvent, type Dispatch, type FormEvent, type RefObject, type SetStateAction } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Plus, Save, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PhotoBoard from "@/components/admin/PhotoBoard";
import { DishPreviewAndGuide } from "./DishPreviewAndGuide";
import type { AdminCategory } from "@/lib/admin-api";
import type { FormState } from "../_lib";

// The dish create/edit form: a 2-step wizard for new dishes (details → photos)
// and an all-in-one editor for existing ones. Scroll refs are owned by the page.
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
  const [cachedPhoto, setCachedPhoto] = useState<string>("");

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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay dismiss */}
      <div className="fixed inset-0 -z-10 cursor-pointer" onClick={closeForm} />

      {/* Adaptive Sheet Modal */}
      <div
        ref={formRef}
        className="relative w-full sm:max-w-2xl lg:max-w-3xl h-[92dvh] sm:h-auto sm:max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Mobile Drag Indicator */}
        <div className="mx-auto w-10 h-1.5 rounded-full bg-zinc-300 my-2 sm:hidden shrink-0" />

        {/* Sticky Top Navigation Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-zinc-200 shrink-0">
          <button
            type="button"
            onClick={closeForm}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 py-1.5 px-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>

          <div className="text-center min-w-0 px-2 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-[#211a14] truncate">
              {editing ? form.name || "Edit Dish" : step === 1 ? "New Dish — Details" : "New Dish — Photos"}
            </h3>
            <div className="text-[10px] font-semibold text-zinc-500 flex items-center justify-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-600" />
              <span>{editing ? "Catalog Item" : `Step ${step} of 2`}</span>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            loading={saving}
            className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs px-3.5 h-8.5 cursor-pointer shrink-0"
            onClick={() => (!editing && step === 1 ? goToPhotos() : submit())}
          >
            {!editing && step === 1 ? (
              <span>Next →</span>
            ) : (
              <span className="flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Save</span>
            )}
          </Button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="menu-dish-editor-form"
          onSubmit={submit}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6"
        >
        {/* Step 1: Core Details */}
        <div className={`space-y-5 ${!editing && step !== 1 ? "hidden" : ""}`}>
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5" /> Core Menu Information:
            </span>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="mi-name" className="text-xs font-semibold text-[#211a14]">
                  Dish Name *
                </Label>
                <Input
                  id="mi-name"
                  required
                  className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  placeholder="e.g. Classic Golden Buttermilk Stack"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mi-price" className="text-xs font-semibold text-[#211a14]">
                  Price ($ AUD) *
                </Label>
                <Input
                  id="mi-price"
                  required
                  inputMode="decimal"
                  className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  placeholder="e.g. 18.50"
                  value={form.price}
                  onChange={set("price")}
                />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="mi-desc" className="text-xs font-semibold text-[#211a14]">
                  Description &amp; Ingredients *
                </Label>
                <Textarea
                  id="mi-desc"
                  required
                  rows={2}
                  className="border-zinc-300 text-[#211a14] font-medium text-xs rounded-xl"
                  placeholder="e.g. Three fluffy buttermilk pancakes layered with whipped vanilla butter, warm organic maple syrup, and seasonal berries."
                  value={form.description}
                  onChange={set("description")}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mi-tag" className="text-xs font-semibold text-[#211a14]">
                    Category
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
              <div className="space-y-1">
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
                  <option value="medium">Medium Heat</option>
                  <option value="hot">Hot &amp; Spicy</option>
                </Select>
              </div>
              {/* Prep time input - commented out per user request; uncomment to restore */}
              {/*
              <div className="space-y-1">
                <Label htmlFor="mi-prep" className="text-xs font-semibold text-[#211a14]">
                  Estimated Prep Time
                </Label>
                <Input
                  id="mi-prep"
                  className="border-zinc-300 text-[#211a14] font-medium text-xs h-10 rounded-xl"
                  placeholder="e.g. 10–12 min"
                  value={form.prep_time}
                  onChange={set("prep_time")}
                />
              </div>
              */}
            </div>
          </div>

          {/* Nutrition Details (Calories & Protein) - commented out per user request; uncomment to restore */}
          {/*
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
              Nutrition Details (Optional):
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="mi-kcal" className="text-xs font-semibold text-[#211a14]">
                  Calories (kcal)
                </Label>
                <Input
                  id="mi-kcal"
                  inputMode="numeric"
                  className="border-zinc-300 text-[#211a14] font-medium text-xs h-10 rounded-xl"
                  placeholder="e.g. 540"
                  value={form.kcal}
                  onChange={set("kcal")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mi-protein" className="text-xs font-semibold text-[#211a14]">
                  Protein (grams)
                </Label>
                <Input
                  id="mi-protein"
                  inputMode="numeric"
                  className="border-zinc-300 text-[#211a14] font-medium text-xs h-10 rounded-xl"
                  placeholder="e.g. 16"
                  value={form.protein_g}
                  onChange={set("protein_g")}
                />
              </div>
            </div>
          </div>
          */}
        </div>

        {/* Step 2: Photos & Storefront Preview */}
        <div className={`space-y-5 ${!editing && step !== 2 ? "hidden" : ""}`}>
          {/* Real-time Customer Storefront Preview Card & Exact Sizing Guide */}
          <DishPreviewAndGuide
            form={form}
            categories={categories}
            onSetPhoto={(url) => setForm((f) => ({ ...f, photo: url }))}
            onSetImage={(url) => setForm((f) => ({ ...f, image: url }))}
          />

          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> High-Resolution Photo Gallery &amp; Cutout:
            </span>
            <p className="text-xs text-zinc-500">
              Upload food shots below. Click <strong>Show on Site</strong> on the image you want customers to see on the public menu and homepage cards.
            </p>
          </div>

          <div ref={photosRef} className="p-4 rounded-lg border border-zinc-200 bg-white space-y-4">
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

            {/* Active Storefront Image Indicator & Mode Selector */}
            {(form.photo || form.image) && (
              <div className="p-4 rounded-xl border border-amber-300/80 bg-linear-to-r from-amber-50/90 via-orange-50/50 to-amber-50/80 space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative h-12 w-12 rounded-lg overflow-hidden border shadow-xs shrink-0 ${
                        isCutoutActive
                          ? "border-emerald-300 bg-transparency-grid p-1"
                          : "border-amber-300 bg-white"
                      }`}
                    >
                      <img
                        src={isCutoutActive ? form.image || form.photo : form.photo || form.image}
                        alt="Active storefront preview"
                        className={`h-full w-full ${isCutoutActive ? "object-contain" : "object-cover"}`}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                        <span>⭐ Active Storefront Display:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide flex items-center gap-1 ${
                            isCutoutActive
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-amber-200/80 text-amber-950 border border-amber-300"
                          }`}
                        >
                          {isCutoutActive ? "✂️ Transparent Cutout Sticker" : "📷 Original Photography"}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        {isCutoutActive
                          ? "Customers see a floating pancake sticker with white halo across menu & homepage cards."
                          : "Customers see the full dining photograph framed inside the card."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Way Quick Switch Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/70">
                  <span className="text-[11px] font-bold text-amber-900">Switch Presentation:</span>

                  <button
                    type="button"
                    onClick={() => {
                      const targetPhoto = cachedPhoto || form.photo;
                      if (targetPhoto) {
                        setForm((f) => ({ ...f, photo: targetPhoto }));
                      }
                    }}
                    disabled={!isCutoutActive || (!cachedPhoto && (!form.photo || form.photo === form.image))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isCutoutActive
                        ? "bg-zinc-900 text-white shadow-xs cursor-default"
                        : "bg-white hover:bg-amber-100 text-zinc-800 border border-amber-300 shadow-2xs"
                    }`}
                  >
                    <span>📷</span>
                    <span>Show Full Photo</span>
                    {!isCutoutActive && (
                      <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-extrabold ml-1">
                        ACTIVE
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (form.image) {
                        setForm((f) => ({ ...f, photo: f.image }));
                      }
                    }}
                    disabled={isCutoutActive || !form.image}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCutoutActive
                        ? "bg-emerald-700 text-white shadow-xs cursor-default"
                        : form.image
                        ? "bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs"
                        : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                    }`}
                  >
                    <span>✂️</span>
                    <span>Show Cutout Sticker</span>
                    {isCutoutActive ? (
                      <span className="text-[9px] bg-emerald-300 text-emerald-950 px-1 rounded font-extrabold ml-1">
                        ACTIVE
                      </span>
                    ) : !form.image ? (
                      <span className="text-[9px] text-zinc-400 font-normal ml-1">(No cutout yet)</span>
                    ) : null}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visibility & Homepage Switches */}
        <div className={`pt-4 border-t border-zinc-200 ${!editing && step !== 2 ? "hidden" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white">
              <div>
                <div className="text-xs font-semibold text-[#211a14]">Available on Menu</div>
                <div className="text-[11px] text-zinc-500">Visible to customers &amp; open for online ordering</div>
              </div>
              <Switch
                checked={form.is_available}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_available: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white">
              <div>
                <div className="text-xs font-semibold text-[#211a14]">Featured on Homepage</div>
                <div className="text-[11px] text-zinc-500">Highlighted in the hero &amp; menu preview</div>
              </div>
              <Switch
                checked={form.is_featured}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
              />
            </div>
          </div>
        </div>

        </form>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 pb-safe shrink-0 shadow-lg">
          <div className="text-xs text-zinc-500 font-medium hidden sm:block">
            {!editing ? `Step ${step} of 2` : "All changes save to live menu"}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!editing && step === 2 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-300 text-[#763a12] text-xs font-bold rounded-xl h-10 px-3 cursor-pointer"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-zinc-600 rounded-xl h-10 px-3 cursor-pointer"
              onClick={closeForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              className="flex-1 sm:flex-none bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs h-10 px-5 cursor-pointer"
              onClick={() => (!editing && step === 1 ? goToPhotos() : submit())}
            >
              {!editing && step === 1 ? (
                <>
                  <span>Next: Upload Photos</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              ) : editing ? (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>{saving ? "Adding to Menu..." : "Add to Menu"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
