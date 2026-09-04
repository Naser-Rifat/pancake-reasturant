"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  UtensilsCrossed,
  Layers,
  Save,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  createMenuItem,
  createMenuItemPhoto,
  deleteMenuItem,
  listMenu,
  listMenuItemPhotos,
  updateMenuItem,
  type AdminMenuItem,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import PhotoBoard from "@/components/admin/PhotoBoard";

import {
  EMPTY_FORM,
  TAG_INFO,
  slugify,
  type FilterCategory,
  type FormState,
} from "./_lib";

export default function MenuAdminPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  // null = form closed, "" = adding new, slug = editing that item
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // photo counts per slug so the list can show them without opening anything
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  // uploads made before the dish exists; attached right after it is created
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  // creating a dish is a two-step wizard; editing shows everything at once
  const [step, setStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const jumpTo = useRef<"top" | "photos">("top");
  const pristine = useRef<FormState>(EMPTY_FORM);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // the form opens above a long table — bring it into view smoothly
  useEffect(() => {
    if (editing === null) return;
    const target = jumpTo.current === "photos" ? photosRef.current : formRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: jumpTo.current === "photos" ? "center" : "start" });
  }, [editing]);

  const closeForm = async () => {
    const dirty = JSON.stringify(pristine.current) !== JSON.stringify(form);
    if (dirty) {
      const ok = await confirm({
        title: "Discard unsaved changes?",
        description: "Everything you typed in this form will be lost.",
        confirmLabel: "Discard",
        destructive: true,
      });
      if (!ok) return;
    }
    setEditing(null);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listMenu()
      .then(async (list) => {
        setItems(list);
        const counts = await Promise.all(
          list.map((i) =>
            listMenuItemPhotos(i.slug)
              .then((ps) => [i.slug, ps.length] as const)
              .catch(() => [i.slug, 0] as const)
          )
        );
        setPhotoCounts(Object.fromEntries(counts));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load menu items"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    jumpTo.current = "top"; // a previous photo-jump must not aim the scroll at a hidden section
    setForm(EMPTY_FORM);
    setPendingPhotos([]);
    setStep(1);
    pristine.current = EMPTY_FORM;
    setEditing("");
    setError("");
  };

  const openEdit = (item: AdminMenuItem, jumpToPhotos = false) => {
    jumpTo.current = jumpToPhotos ? "photos" : "top";
    const next: FormState = {
      slug: item.slug,
      name: item.name,
      description: item.description,
      price: item.price,
      tag: item.tag,
      heat: item.heat,
      kcal: item.kcal?.toString() ?? "",
      protein_g: item.protein_g?.toString() ?? "",
      prep_time: item.prep_time,
      image: item.image,
      photo: item.photo ?? "",
      is_available: item.is_available,
      is_featured: item.is_featured,
    };
    setForm(next);
    pristine.current = next;
    setPendingPhotos([]);
    setStep(1);
    setEditing(item.slug);
    setError("");
  };

  /** don't let staff reach the photo step with an unnamed, priceless dish */
  const goToPhotos = () => {
    const missing = (["name", "price", "description"] as const).find((k) => !form[k].trim());
    if (missing) {
      const el = document.getElementById(`mi-${missing === "description" ? "desc" : missing}`);
      el?.focus();
      toast({ variant: "error", title: `Add the ${missing === "description" ? "description" : missing} first` });
      return;
    }
    setStep(2);
  };

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    const payload: Partial<AdminMenuItem> = {
      slug: editing || form.slug || slugify(form.name),
      name: form.name,
      description: form.description,
      price: form.price,
      tag: form.tag,
      heat: form.heat,
      kcal: form.kcal ? Number(form.kcal) : null,
      protein_g: form.protein_g ? Number(form.protein_g) : null,
      prep_time: form.prep_time,
      image: form.image,
      photo: form.photo,
      is_available: form.is_available,
      is_featured: form.is_featured,
    };
    try {
      if (editing) {
        await updateMenuItem(editing, payload);
        pristine.current = form;
        toast({ variant: "success", title: `${form.name} updated` });
        setEditing(null);
      } else {
        const created = await createMenuItem(payload);
        for (const [i, url] of pendingPhotos.entries()) {
          await createMenuItemPhoto({
            menu_item: created.slug,
            image: url,
            alt: `${created.name} photo`,
            sort_order: i,
          });
        }
        setPhotoCounts((c) => ({ ...c, [created.slug]: pendingPhotos.length }));
        setPendingPhotos([]);
        pristine.current = form;
        setEditing(created.slug);
        toast({
          variant: "success",
          title: `${created.name} added to the menu`,
          description: "You can add extra photos now.",
        });
      }
      load();
    } catch (err) {
      toast({
        variant: "error",
        title: "Save failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: AdminMenuItem) => {
    const ok = await confirm({
      title: `Delete “${item.name}” from the menu?`,
      description: "Its photos and page disappear from the website immediately.",
      confirmLabel: "Delete dish",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteMenuItem(item.slug);
      toast({ variant: "success", title: `${item.name} deleted from the menu` });
      load();
    } catch (err) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const toggle = async (item: AdminMenuItem, changes: Partial<AdminMenuItem>, note: string) => {
    const prev = items;
    setItems((xs) => xs.map((x) => (x.slug === item.slug ? { ...x, ...changes } : x)));
    try {
      await updateMenuItem(item.slug, changes);
      toast({ variant: "success", title: note });
    } catch (err) {
      setItems(prev);
      toast({
        variant: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  // Filtered & Searched Menu Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.price.includes(searchQuery);

      // Category filter
      let matchesCat = true;
      if (categoryFilter === "sweet") matchesCat = item.tag === "sweet";
      else if (categoryFilter === "savoury") matchesCat = item.tag === "savoury";
      else if (categoryFilter === "choc") matchesCat = item.tag === "choc";
      else if (categoryFilter === "featured") matchesCat = item.is_featured;
      else if (categoryFilter === "live") matchesCat = item.is_available;

      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, categoryFilter]);

  // Statistics
  const totalCount = items.length;
  const liveCount = items.filter((i) => i.is_available).length;
  const featuredCount = items.filter((i) => i.is_featured).length;
  const sweetCount = items.filter((i) => i.tag === "sweet").length;
  const savouryCount = items.filter((i) => i.tag === "savoury").length;
  const chocCount = items.filter((i) => i.tag === "choc").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#211a14] tracking-tight">
            Menu
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Add dishes, set prices and photos, and control availability.
          </p>
        </div>

        <Button
          onClick={openAdd}
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-lg shadow-xs shrink-0 transition-transform"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Dish</span>
        </Button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 [&>*]:min-w-0">
        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Total Catalog</span>
            <div className="text-2xl font-semibold text-[#211a14]">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${totalCount}`}
            </div>
          </div>
          
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Live Taking Orders</span>
            <div className="text-2xl font-semibold text-emerald-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${liveCount}`}
            </div>
          </div>
          
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Home Featured</span>
            <div className="text-2xl font-semibold text-amber-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${featuredCount}`}
            </div>
          </div>
          
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Categories</span>
            <div className="text-xs font-bold text-[#211a14] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              {loading ? (
                <Skeleton className="h-4 w-32 rounded-md" />
              ) : (
                <>
                  <span className="text-amber-900">{sweetCount} Sweet</span>·
                  <span className="text-orange-900">{savouryCount} Savoury</span>·
                  <span className="text-[#522b14]">{chocCount} Choc</span>
                </>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-100 text-[#763a12] flex items-center justify-center font-bold text-lg">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {error && <AdminError message={error} onRetry={load} />}

      {/* ========================================================================= */}
      {/* DISH CREATION & EDITING MODAL / CARD                                      */}
      {/* ========================================================================= */}
      {editing !== null && (
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
      )}

      {/* ========================================================================= */}
      {/* SEARCH & CATEGORY FILTER BAR                                              */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              className="pl-10 h-11 text-xs font-bold border-zinc-300 rounded-lg bg-white text-[#211a14] placeholder:text-zinc-400"
              placeholder="Search dishes by name, ingredients, or price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-xs font-bold text-zinc-500 shrink-0">
            Showing <strong>{filteredItems.length}</strong> of {totalCount} items
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200">
          {[
            { id: "all", label: "All Dishes", count: totalCount },
            { id: "sweet", label: "Sweet Stacks", count: sweetCount },
            { id: "savoury", label: "Savoury Brunch", count: savouryCount },
            { id: "choc", label: "Choc Loaded", count: chocCount },
            { id: "featured", label: "Featured", count: featuredCount },
            { id: "live", label: "Available Now", count: liveCount },
          ].map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as FilterCategory)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#763a12] text-white shadow-xs"
                    : "bg-white text-[#211a14] border border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MENU ITEMS TABLE                                                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            
            <h3 className="text-base font-semibold text-[#211a14]">No dishes matched your filter</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your search keyword or selecting a different category filter above.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-300 text-[#763a12] font-bold text-xs rounded-xl mt-2"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-white text-[#763a12] text-[11px] font-semibold uppercase tracking-wide">
                  <th className="py-3.5 px-4">Dish &amp; Ingredients</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Photos</th>
                  <th className="py-3.5 px-3 text-center">Available</th>
                  <th className="py-3.5 px-3 text-center">Home Star</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-medium text-[#211a14]">
                {filteredItems.map((item) => {
                  const tagData = TAG_INFO[item.tag] ?? TAG_INFO.sweet;
                  const photoCount = photoCounts[item.slug] ?? 0;
                  return (
                    <tr
                      key={item.slug}
                      className="hover:bg-zinc-50 transition-colors group"
                    >
                      {/* Dish & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(item, true)}
                            title="Click to manage photos"
                            aria-label={`Manage photos for ${item.name}`}
                            className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 group-hover:border-[#763a12] transition-transform shadow-2xs"
                          >
                            {item.photo || item.image ? (
                              <Image
                                src={item.photo || item.image}
                                alt={item.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-bold">
                                🥞
                              </div>
                            )}
                          </button>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-[#211a14] truncate">{item.name}</span>
                              {item.heat === "medium" && <span title="Medium Heat">🌶️</span>}
                              {item.heat === "hot" && <span title="Hot & Spicy">🔥</span>}
                            </div>
                            <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs sm:max-w-md">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${tagData.bg} ${tagData.text} ${tagData.border}`}
                        >
                          <span>{tagData.label}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#763a12] px-2.5 py-1 rounded-xl bg-white border border-zinc-200">
                          ${item.price}
                        </span>
                      </td>

                      {/* Photo Count Button */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(item, true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border border-zinc-300 bg-white text-[#763a12] hover:bg-zinc-50 shadow-2xs transition-all"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>{photoCount > 0 ? `${photoCount} Photos` : "Add"}</span>
                        </button>
                      </td>

                      {/* Available Switch */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <Switch
                          aria-label={`${item.name} available`}
                          checked={item.is_available}
                          onCheckedChange={(v) =>
                            toggle(
                              item,
                              { is_available: v },
                              v ? `${item.name} is now available on menu` : `${item.name} hidden from menu`
                            )
                          }
                        />
                      </td>

                      {/* Featured Home Star Switch */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <Switch
                          aria-label={`${item.name} featured on home page`}
                          checked={item.is_featured}
                          onCheckedChange={(v) =>
                            toggle(
                              item,
                              { is_featured: v },
                              v ? `${item.name} featured on home page` : `${item.name} removed from featured`
                            )
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-bold border-zinc-300 text-[#763a12] hover:bg-zinc-50 rounded-xl"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => remove(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
