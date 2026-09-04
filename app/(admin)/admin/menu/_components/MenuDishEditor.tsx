import type { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Plus, Save, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PhotoBoard from "@/components/admin/PhotoBoard";
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
}) {
  return (
    <div ref={formRef} className="scroll-mt-6 bg-white p-6 sm:p-8 rounded-xl border border-[#763a12] shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#763a12] text-white uppercase tracking-wide">
            {editing ? "EDITING DISH" : `NEW DISH — STEP ${step} OF 2`}
          </div>
          <h3 className="text-lg font-semibold text-[#211a14]">
            {editing ? form.name || "Edit Dish Details" : step === 1 ? "Step 1: Dish Details & Pricing" : "Step 2: Dish Photo Gallery"}
          </h3>
          <p className="text-xs text-zinc-500">
            {editing
              ? "Changes save instantly to the live public menu and ordering system."
              : step === 1
              ? "Enter the dish name, price, category tag, and culinary description."
              : "Upload photos and designate the main thumbnail and background-free cutout."}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Close form" className="rounded-xl hover:bg-zinc-100">
          <X className="h-5 w-5 text-zinc-500" />
        </Button>
      </div>

      <form onSubmit={submit} className="space-y-6">
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
                <Label htmlFor="mi-tag" className="text-xs font-semibold text-[#211a14]">
                  Menu Category Tag
                </Label>
                <Select
                  id="mi-tag"
                  className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                  value={form.tag}
                  onChange={set("tag")}
                >
                  <option value="sweet">Sweet Stack</option>
                  <option value="savoury">Savoury Brunch</option>
                  <option value="choc">Choc Loaded</option>
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
            </div>
          </div>

          {/* Nutrition */}
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
        </div>

        {/* Step 2: Photos */}
        <div className={`space-y-5 ${!editing && step !== 2 ? "hidden" : ""}`}>
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> High-Resolution Photo Gallery &amp; Cutout:
            </span>
            <p className="text-xs text-zinc-500">
              Upload food shots below. Mark one as <strong>Main</strong> for card thumbnails and hero display. <strong>Cutout</strong> is the optional transparent PNG for special promo tiles.
            </p>
          </div>

          <div ref={photosRef} className="p-4 rounded-lg border border-zinc-200 bg-white">
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
        </div>

        {/* Visibility & Homepage Switches */}
        <div className={`pt-4 border-t border-zinc-200 ${!editing && step !== 2 ? "hidden" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white">
              <div>
                <div className="text-xs font-semibold text-[#211a14]">Takeaway Available</div>
                <div className="text-[11px] text-zinc-500">Customers can order this dish online</div>
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

        {/* Sticky Form Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
          <span className="text-xs font-bold text-zinc-500">
            {!editing ? `Step ${step} of 2` : "Editing item in catalog"}
          </span>
          <div className="flex items-center gap-2">
            {!editing && step === 2 && (
              <Button
                type="button"
                variant="outline"
                className="border-zinc-300 text-[#763a12] text-xs font-bold rounded-xl"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Details
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="text-xs font-bold text-zinc-600 rounded-xl"
              onClick={closeForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
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
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Add to Menu</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
