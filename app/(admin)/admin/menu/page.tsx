"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  Layers,
} from "lucide-react";
import {
  createMenuItem,
  createMenuItemPhoto,
  deleteMenuItem,
  listCategories,
  listMenu,
  listMenuItemPhotos,
  updateMenuItem,
  type AdminCategory,
  type AdminMenuItem,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { AdminDataTable, AdminTablePagination, AdminTableSurface, type AdminTableColumn } from "@/components/admin/AdminTable";

import {
  EMPTY_FORM,
  TAG_INFO,
  getCategoryBadge,
  slugify,
  type FilterCategory,
  type FormState,
} from "./_lib";
import { MenuDishEditor } from "./_components/MenuDishEditor";

const MENU_COLUMNS: AdminTableColumn<AdminMenuItem>[] = [
  { id: "dish", header: "Dish & Ingredients", headerClassName: "py-3.5 px-4" },
  { id: "category", header: "Category", headerClassName: "py-3.5 px-3" },
  { id: "price", header: "Price", headerClassName: "py-3.5 px-3" },
  { id: "photos", header: "Photos", headerClassName: "py-3.5 px-3" },
  { id: "available", header: "Available", headerClassName: "py-3.5 px-3 text-center" },
  { id: "featured", header: "Home Star", headerClassName: "py-3.5 px-3 text-center" },
  { id: "actions", header: "Actions", headerClassName: "py-3.5 px-4 text-right" },
];

export default function MenuAdminPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const tableRef = useRef<HTMLDivElement>(null);
  // null = form closed, "" = adding new, slug = editing that item
  const [editing, setEditing] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
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
  const queryClient = useQueryClient();
  const refreshMenu = () =>
    queryClient.invalidateQueries({ queryKey: ["admin"] });

  // Lock body scroll when editor modal sheet is open
  useEffect(() => {
    if (editing !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing]);

  useEffect(() => {
    if (editing === null) return;
    if (jumpTo.current === "photos") {
      photosRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  const menuQuery = useQuery({
    queryKey: ["admin", "menu"],
    queryFn: async () => {
      const [items, categories] = await Promise.all([listMenu(), listCategories().catch(() => [])]);
      const photoCounts: Record<string, number> = {};
      for (const item of items) {
        if (typeof item.photos_count === "number") {
          photoCounts[item.slug] = item.photos_count;
        }
      }
      return { items, categories, photoCounts };
    },
  });
  useEffect(() => {
    if (!menuQuery.data) return;
    setItems(menuQuery.data.items);
    setCategories(menuQuery.data.categories);
    setPhotoCounts((prev) => ({ ...menuQuery.data.photoCounts, ...prev }));
  }, [menuQuery.data]);
  const loading = menuQuery.isPending;
  const queryError = menuQuery.error instanceof Error ? menuQuery.error.message : "";
  const load = () => void menuQuery.refetch();
  const saveMutation = useMutation({
    mutationFn: ({ slug, payload }: { slug?: string; payload: Partial<AdminMenuItem> }) =>
      slug ? updateMenuItem(slug, payload) : createMenuItem(payload),
    onSettled: refreshMenu,
  });
  const photoMutation = useMutation({
    mutationFn: createMenuItemPhoto,
    onSettled: refreshMenu,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSettled: refreshMenu,
  });
  const updateMutation = useMutation({
    mutationFn: ({ slug, changes }: { slug: string; changes: Partial<AdminMenuItem> }) =>
      updateMenuItem(slug, changes),
    onSettled: refreshMenu,
  });
  const saving = saveMutation.isPending || photoMutation.isPending;

  const openAdd = () => {
    jumpTo.current = "top"; // a previous photo-jump must not aim the scroll at a hidden section
    setForm(EMPTY_FORM);
    setPendingPhotos([]);
    setStep(1);
    pristine.current = EMPTY_FORM;
    setEditing("");
  };

  const openEdit = (item: AdminMenuItem, jumpToPhotos = false) => {
    jumpTo.current = jumpToPhotos ? "photos" : "top";
    const matchedCat: number | undefined =
      (typeof item.category === "number" ? item.category : undefined) ??
      (item.category_slug ? categoriesMap.get(item.category_slug)?.id : undefined);
    const next: FormState = {
      slug: item.slug,
      name: item.name,
      description: item.description,
      price: item.price,
      tag: item.tag,
      category: matchedCat,
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
  };

  /** shared required-field + numeric-price guard for both the wizard and edit save */
  const validate = (): boolean => {
    const missing = (["name", "price", "description"] as const).find((k) => !form[k].trim());
    if (missing) {
      const el = document.getElementById(`mi-${missing === "description" ? "desc" : missing}`);
      el?.focus();
      toast({ variant: "error", title: `Add the ${missing === "description" ? "description" : missing} first` });
      return false;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      document.getElementById("mi-price")?.focus();
      toast({ variant: "error", title: "Enter a valid price", description: "Numbers only, e.g. 18.50" });
      return false;
    }
    return true;
  };

  /** don't let staff reach the photo step with an unnamed, priceless dish */
  const goToPhotos = () => {
    if (!validate()) return;
    setStep(2);
  };

  /** free-text number field → a real number, or null when blank/invalid (never NaN) */
  const numOrNull = (v: string) => (v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (savedForm?: FormState, photosList?: string[]) => {
    const liveDesc = typeof document !== "undefined" ? (document.getElementById("mi-desc") as HTMLTextAreaElement | null)?.value : undefined;
    const livePrice = typeof document !== "undefined" ? (document.getElementById("mi-price") as HTMLInputElement | null)?.value : undefined;
    const liveName = typeof document !== "undefined" ? (document.getElementById("mi-name") as HTMLInputElement | null)?.value : undefined;
    const liveHeatEl = typeof document !== "undefined" ? (document.getElementById("mi-heat") as HTMLSelectElement | null) : null;
    const liveTagEl = typeof document !== "undefined" ? (document.getElementById("mi-tag") as HTMLSelectElement | null) : null;

    const baseForm = savedForm || form;

    let resolvedCategory = baseForm.category;
    let resolvedTag = baseForm.tag;
    if (liveTagEl && liveTagEl.value) {
      const val = liveTagEl.value;
      const matched = categories.find((c) => String(c.id) === val || c.slug === val);
      if (matched) {
        resolvedCategory = matched.id;
        resolvedTag = matched.slug;
      } else {
        resolvedTag = val;
      }
    }

    const currentForm: FormState = {
      ...baseForm,
      name: liveName && liveName.trim() ? liveName : baseForm.name,
      price: livePrice && livePrice.trim() ? livePrice : baseForm.price,
      description: liveDesc !== undefined && liveDesc.trim() ? liveDesc : baseForm.description,
      heat: liveHeatEl && liveHeatEl.value ? (liveHeatEl.value as "none" | "medium" | "hot") : baseForm.heat,
      tag: resolvedTag,
      category: resolvedCategory,
    };
    const currentPendingPhotos = photosList || pendingPhotos;
    const missing = (["name", "price", "description"] as const).find((k) => !currentForm[k].trim());
    if (missing) {
      const el = document.getElementById(`mi-${missing === "description" ? "desc" : missing}`);
      el?.focus();
      toast({ variant: "error", title: `Add the ${missing === "description" ? "description" : missing} first` });
      return;
    }
    const price = Number(currentForm.price);
    if (!Number.isFinite(price) || price < 0) {
      document.getElementById("mi-price")?.focus();
      toast({ variant: "error", title: "Enter a valid price", description: "Numbers only, e.g. 18.50" });
      return;
    }

    const payload: Partial<AdminMenuItem> = {
      slug: editing || currentForm.slug || slugify(currentForm.name),
      name: currentForm.name,
      description: currentForm.description,
      price: currentForm.price,
      tag: currentForm.tag,
      category: currentForm.category,
      heat: currentForm.heat,
      kcal: numOrNull(currentForm.kcal),
      protein_g: numOrNull(currentForm.protein_g),
      prep_time: currentForm.prep_time,
      image: currentForm.image,
      photo: currentForm.photo,
      is_available: currentForm.is_available,
      is_featured: currentForm.is_featured,
    };
    if (editing) {
      const targetSlug = editing;
      const prevItems = items;
      const matchedCat = currentForm.category
        ? categories.find((c) => c.id === currentForm.category)
        : categoriesMap.get(currentForm.tag);

      // 1. Optimistic Update: Update the table row in state immediately (0ms)
      setItems((prev) =>
        prev.map((it) =>
          it.slug === targetSlug
            ? {
                ...it,
                ...payload,
                category: currentForm.category ?? it.category,
                category_name: matchedCat?.name ?? it.category_name,
                category_slug: matchedCat?.slug ?? it.category_slug,
                category_icon: matchedCat?.icon ?? it.category_icon,
              }
            : it
        )
      );

      // 2. Close the editor and show confirmation immediately
      pristine.current = currentForm;
      setEditing(null);
      setSavedSlug(targetSlug);
      setTimeout(() => setSavedSlug(null), 2500);
      toast({ variant: "success", title: `${currentForm.name} updated` });

      // 3. Persist to backend in the background with automatic rollback on error
      saveMutation.mutate(
        { slug: targetSlug, payload },
        {
          onError: (err) => {
            setItems(prevItems);
            toast({
              variant: "error",
              title: "Save failed",
              description: err instanceof Error ? err.message : undefined,
            });
          },
        }
      );
      return;
    }

    try {
      const created = await saveMutation.mutateAsync({ payload });
      // Add newly created dish to items list immediately
      setItems((prev) => [created, ...prev.filter((i) => i.slug !== created.slug)]);
      setSavedSlug(created.slug);
      setTimeout(() => setSavedSlug(null), 2500);
      // The dish now exists. Switch to edit mode *before* attaching photos so a
      // failed photo upload can't strand the form in create mode — a retry would
      // otherwise re-POST the same slug and be rejected as a duplicate.
      pristine.current = form;
      setEditing(created.slug);
      const failed: string[] = [];
      for (const [i, url] of pendingPhotos.entries()) {
        try {
          await photoMutation.mutateAsync({
            menu_item: created.slug,
            image: url,
            alt: `${created.name} photo`,
            sort_order: i,
          });
        } catch {
          failed.push(url); // keep it queued and visible instead of losing it
        }
      }
      setPendingPhotos(failed);
      setPhotoCounts((c) => ({ ...c, [created.slug]: pendingPhotos.length - failed.length }));
      if (failed.length) {
        toast({
          variant: "error",
          title: `${created.name} saved — but ${failed.length} photo(s) didn't upload`,
          description: "They're still shown below; try adding them again.",
        });
      } else {
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
    }
  };

  // slugs with a PATCH/DELETE in flight — locks that row's switches and trash
  // button so a double-tap can't fire the same mutation twice
  const [pendingSlugs, setPendingSlugs] = useState<Set<string>>(new Set());
  const markPending = (slug: string, on: boolean) =>
    setPendingSlugs((s) => {
      const next = new Set(s);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });

  const remove = async (item: AdminMenuItem) => {
    if (pendingSlugs.has(item.slug)) return;
    const ok = await confirm({
      title: `Delete “${item.name}” from the menu?`,
      description: "Its photos and page disappear from the website immediately.",
      confirmLabel: "Delete dish",
      destructive: true,
    });
    if (!ok) return;
    const prev = items;
    markPending(item.slug, true);
    setItems((xs) => xs.filter((x) => x.slug !== item.slug));
    try {
      await deleteMutation.mutateAsync(item.slug);
      toast({ variant: "success", title: `${item.name} deleted from the menu` });
    } catch (err) {
      setItems(prev);
      toast({
        variant: "error",
        title: "Delete failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      markPending(item.slug, false);
    }
  };

  const toggle = async (item: AdminMenuItem, changes: Partial<AdminMenuItem>, note: string) => {
    if (pendingSlugs.has(item.slug)) return;
    const prev = items;
    markPending(item.slug, true);
    setItems((xs) => xs.map((x) => (x.slug === item.slug ? { ...x, ...changes } : x)));
    try {
      await updateMutation.mutateAsync({ slug: item.slug, changes });
      toast({ variant: "success", title: note });
    } catch (err) {
      setItems(prev);
      toast({
        variant: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      markPending(item.slug, false);
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
      if (categoryFilter === "featured") matchesCat = item.is_featured;
      else if (categoryFilter === "live") matchesCat = item.is_available;
      else if (categoryFilter !== "all") {
        matchesCat = item.category_slug === categoryFilter || item.tag === categoryFilter;
      }

      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, categoryFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  // Keep page within valid bounds if items count shrinks
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Paginated slice for current page
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Statistics — memoized to avoid redundant array filtering
  const { totalCount, liveCount, featuredCount, sweetCount, savouryCount, chocCount } = useMemo(() => {
    let live = 0;
    let feat = 0;
    let sweet = 0;
    let savoury = 0;
    let choc = 0;
    for (const it of items) {
      if (it.is_available) live++;
      if (it.is_featured) feat++;
      if (it.category_slug === "sweet" || it.tag === "sweet") sweet++;
      else if (it.category_slug === "savoury" || it.tag === "savoury") savoury++;
      else if (it.category_slug === "choc" || it.tag === "choc") choc++;
    }
    return {
      totalCount: items.length,
      liveCount: live,
      featuredCount: feat,
      sweetCount: sweet,
      savouryCount: savoury,
      chocCount: choc,
    };
  }, [items]);

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

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs"
          >
            <Layers className="h-4 w-4 text-amber-800" />
            <span>Manage Categories</span>
          </Link>

          <Button
            onClick={openAdd}
            className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-lg shadow-xs shrink-0 transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Dish</span>
          </Button>
        </div>
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

      {queryError && <AdminError message={queryError} onRetry={load} />}

      {/* ========================================================================= */}
      {/* DISH CREATION & EDITING MODAL / CARD                                      */}
      {/* ========================================================================= */}
      {editing !== null && (
        <MenuDishEditor
          key={editing || "new-dish"}
          editing={editing}
          initialForm={form}
          saving={saving}
          closeForm={() => setEditing(null)}
          submit={submit}
          pendingPhotos={pendingPhotos}
          setPhotoCounts={setPhotoCounts}
          formRef={formRef}
          photosRef={photosRef}
          categories={categories}
        />
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
              className="pl-10 h-11 text-base sm:text-xs font-bold border-zinc-300 rounded-lg bg-white text-[#211a14] placeholder:text-zinc-400"
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
            Showing{" "}
            <strong className="text-[#763a12]">
              {filteredItems.length === 0
                ? 0
                : `${(page - 1) * pageSize + 1}–${Math.min(filteredItems.length, page * pageSize)}`}
            </strong>{" "}
            of <strong>{filteredItems.length}</strong> dishes
            {filteredItems.length !== totalCount && ` (filtered from ${totalCount})`}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200">
          {[
            { id: "all", label: "All Dishes", count: totalCount },
            ...categories.map((c) => ({
              id: c.slug,
              label: `${c.icon || "🥞"} ${c.name}`,
              count: items.filter((i) => i.category_slug === c.slug || i.tag === c.slug).length,
            })),
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
      <AdminTableSurface ref={tableRef} className="scroll-mt-6">
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
          <AdminDataTable
            rows={paginatedItems}
            rowKey={(item) => item.slug}
            columns={MENU_COLUMNS}
            bodyClassName="divide-y divide-zinc-100 text-xs font-medium text-[#211a14]"
            renderRow={(item) => {
                  const tagData = getCategoryBadge(item, categoriesMap);
                  const photoCount = photoCounts[item.slug] ?? 0;
                  return (
                    <tr
                      className={`hover:bg-zinc-50 transition-all duration-300 group ${
                        savedSlug === item.slug
                          ? "bg-amber-100/90 ring-2 ring-amber-500 shadow-sm"
                          : ""
                      }`}
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
                          disabled={pendingSlugs.has(item.slug)}
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
                          disabled={pendingSlugs.has(item.slug)}
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
                            disabled={pendingSlugs.has(item.slug)}
                            onClick={() => remove(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }}
          />
        )}

        {/* Numbered Pagination & Rows-Per-Page Controls */}
        {!loading && filteredItems.length > 0 && (
          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            totalLoaded={filteredItems.length}
            pageSizeOptions={[
              { value: 8, label: "8 dishes" },
              { value: 12, label: "12 dishes" },
              { value: 20, label: "20 dishes" },
              { value: 50, label: "50 dishes" },
            ]}
            pageSizeAriaLabel="Dishes per page"
            summary={<>{filteredItems.length} total {filteredItems.length === 1 ? "dish" : "dishes"}</>}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        )}
      </AdminTableSurface>
    </div>
  );
}
