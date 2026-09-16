"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Utensils,
  MoveUp,
  MoveDown,
  X,
  ExternalLink,
} from "lucide-react";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type AdminCategory,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { AdminDataTable, AdminTablePagination, AdminTableSurface, type AdminTableColumn } from "@/components/admin/AdminTable";

const PRESET_ICONS = [
  "🥞", "🍯", "🥑", "🍫", "☕", "🍟", "🥤", "🍓",
  "🍳", "🧇", "🍰", "🥐", "🍦", "🍨", "🍩", "🥗",
  "🥪", "🍕", "🌮", "🍹", "🍵", "🧃", "🧁", "🍪",
];

const CATEGORY_COLUMNS: AdminTableColumn<AdminCategory>[] = [
  { id: "position", header: "Position", headerClassName: "py-3 px-4 w-24 text-center" },
  { id: "category", header: "Category", headerClassName: "py-3 px-4" },
  { id: "slug", header: "Slug", headerClassName: "py-3 px-4" },
  { id: "description", header: "Description", headerClassName: "py-3 px-4" },
  { id: "dishes", header: "Dishes", headerClassName: "py-3 px-4 text-center" },
  { id: "status", header: "Status", headerClassName: "py-3 px-4 text-center" },
  { id: "actions", header: "Actions", headerClassName: "py-3 px-4 text-right" },
];

interface CategoryFormData {
  name: string;
  slug: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: CategoryFormData = {
  name: "",
  slug: "",
  icon: "🥞",
  description: "",
  sort_order: 1,
  is_active: true,
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const tableRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);

  const { confirm } = useConfirm();
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    setFormData({
      ...EMPTY_FORM,
      sort_order: maxOrder + 1,
    });
    setAutoSlug(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "🥞",
      description: cat.description || "",
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setAutoSlug(false);
    setFormError(null);
    setModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? slugify(name) : prev.slug,
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Please enter a category name.");
      return;
    }
    const finalSlug = (formData.slug || slugify(formData.name)).trim();
    if (!finalSlug) {
      setFormError("Please enter a valid slug.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        name: formData.name.trim(),
        slug: finalSlug,
        icon: formData.icon.trim() || "🥞",
        description: formData.description.trim(),
        sort_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active,
      };

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.sort_order - b.sort_order)
        );
        toast({ variant: "success", title: "Category updated", description: `"${updated.name}" has been updated.` });
      } else {
        const created = await createCategory(payload);
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
        toast({ variant: "success", title: "Category created", description: `"${created.name}" is now available.` });
      }

      setModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: AdminCategory, nextVal: boolean) => {
    // optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextVal } : c))
    );
    try {
      await updateCategory(cat.id, { is_active: nextVal });
      toast({
        variant: "success",
        title: nextVal ? "Category activated" : "Category hidden",
        description: `"${cat.name}" is ${nextVal ? "now visible" : "hidden from storefront"}.`,
      });
    } catch (err: any) {
      // rollback
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: cat.is_active } : c))
      );
      toast({
        title: "Update failed",
        description: err?.message || "Could not update status.",
        variant: "error",
      });
    }
  };

  const orderedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
      ),
    [categories],
  );

  const handleOrderStep = async (cat: AdminCategory, delta: -1 | 1) => {
    if (reordering) return;

    const from = orderedCategories.findIndex((item) => item.id === cat.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= orderedCategories.length) return;

    const previous = categories;
    const reordered = [...orderedCategories];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    const normalized = reordered.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    const oldOrder = new Map(previous.map((item) => [item.id, item.sort_order]));
    const changed = normalized.filter(
      (item) => oldOrder.get(item.id) !== item.sort_order,
    );

    setCategories(normalized);
    setReordering(true);
    try {
      await Promise.all(
        changed.map((item) =>
          updateCategory(item.id, { sort_order: item.sort_order }),
        ),
      );
      toast({
        variant: "success",
        title: "Category order updated",
        description: `“${cat.name}” is now in position ${to + 1}.`,
      });
    } catch (err: any) {
      setCategories(previous);
      await loadCategories();
      toast({
        title: "Reorder failed",
        description: err?.message || "Could not reorder category.",
        variant: "error",
      });
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (cat.dish_count > 0) {
      await confirm({
        title: "Cannot Delete Category",
        description: `"${cat.name}" has ${cat.dish_count} dish(es) assigned to it. Please reassign or delete those dishes first in Menu, or switch this category to Hidden/Inactive instead.`,
        confirmLabel: "Understood",
        cancelLabel: "Close",
      });
      return;
    }

    const ok = await confirm({
      title: `Delete "${cat.name}"?`,
      description: "Are you sure you want to delete this category? This action cannot be undone.",
      confirmLabel: "Delete Category",
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast({ variant: "success", title: "Category deleted", description: `"${cat.name}" has been removed.` });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete category.",
        variant: "error",
      });
    }
  };

  const filteredCategories = useMemo(() => {
    return orderedCategories.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
          ? c.is_active
          : !c.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [orderedCategories, searchQuery, filterStatus]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus]);

  const pageCategories = useMemo(() => {
    return filteredCategories.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredCategories, page, pageSize]);

  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.is_active).length;
  const totalDishes = categories.reduce((sum, c) => sum + (c.dish_count || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold text-[#211a14] tracking-tight">
              Categories
            </h1>
          </div>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Organize dishes into vibrant menu categories. Custom icons and order reflect across the storefront and admin catalog.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="text-zinc-600 hover:text-zinc-900 rounded-lg text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>

          <Button
            onClick={openCreateModal}
            className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 px-4 py-2 rounded-lg shadow-xs transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
              Total Categories
            </span>
            <div className="text-2xl font-bold text-[#211a14]">
              {loading ? <Skeleton className="h-7 w-16" /> : totalCount}
            </div>
          </div>
          <span className="text-2xl">🥞</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Active / Visible
            </span>
            <div className="text-2xl font-bold text-emerald-950">
              {loading ? <Skeleton className="h-7 w-16" /> : activeCount}
            </div>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-600/70" />
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              Assigned Dishes
            </span>
            <div className="text-2xl font-bold text-amber-950">
              {loading ? <Skeleton className="h-7 w-16" /> : totalDishes}
            </div>
          </div>
          <Utensils className="h-6 w-6 text-amber-600/70" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white border border-zinc-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="pl-8 text-xs h-9 rounded-lg border-zinc-300"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filterStatus === status
                  ? "bg-[#211a14] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Categories Table / List */}
      {error ? (
        <AdminError message={error} onRetry={loadCategories} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-300 bg-white">
          <span className="text-4xl">📂</span>
          <h3 className="mt-3 text-sm font-bold text-zinc-900">No categories found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms or filter to see more categories."
              : "Get started by adding your first restaurant menu category."}
          </p>
          <Button
            onClick={openCreateModal}
            className="mt-4 bg-[#763a12] hover:bg-[#5e2d0d] text-white text-xs font-bold rounded-lg px-4 py-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Category
          </Button>
        </div>
      ) : (
        <AdminTableSurface ref={tableRef} className="shadow-2xs">
          <AdminDataTable
            rows={pageCategories}
            rowKey={(category) => category.id}
            columns={CATEGORY_COLUMNS}
            tableClassName="text-xs [&_thead_tr]:bg-zinc-50/70 [&_thead_tr]:text-[10px] [&_thead_tr]:font-bold [&_thead_tr]:tracking-wider [&_thead_tr]:text-zinc-600"
            bodyClassName="divide-y divide-zinc-200"
            renderRow={(cat) => {
                  const position = orderedCategories.findIndex((item) => item.id === cat.id);
                  return (
                    <tr className="hover:bg-zinc-50/60 transition-colors group">
                    {/* Sort Order Controls */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-mono font-bold text-zinc-700 w-5">
                          {position + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            title="Move Up"
                            onClick={() => handleOrderStep(cat, -1)}
                            disabled={reordering || position === 0}
                            className="p-0.5 text-zinc-400 hover:text-zinc-900 rounded hover:bg-zinc-200 disabled:opacity-25 disabled:pointer-events-none"
                          >
                            <MoveUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            onClick={() => handleOrderStep(cat, 1)}
                            disabled={reordering || position === orderedCategories.length - 1}
                            className="p-0.5 text-zinc-400 hover:text-zinc-900 rounded hover:bg-zinc-200 disabled:opacity-25 disabled:pointer-events-none"
                          >
                            <MoveDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Icon & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl border border-amber-200/60 shadow-2xs">
                          {cat.icon || "🥞"}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-[#211a14] block">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            ID: {cat.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-zinc-600 max-w-xs truncate">
                      {cat.description || (
                        <span className="text-zinc-300 italic">None</span>
                      )}
                    </td>

                    {/* Dishes Count */}
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/menu?category=${cat.slug}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-900 hover:bg-amber-200 transition-colors"
                        title="View dishes in this category"
                      >
                        <Utensils className="h-3 w-3" />
                        <span>{cat.dish_count}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </Link>
                    </td>

                    {/* Status Active Toggle */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={cat.is_active}
                          onCheckedChange={(val) => handleToggleActive(cat, val)}
                        />
                        <span
                          className={`text-[11px] font-semibold ${
                            cat.is_active ? "text-emerald-700" : "text-zinc-400"
                          }`}
                        >
                          {cat.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(cat)}
                          className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                          title="Edit Category"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    </tr>
                  );
                }}
          />

          {/* Numbered Pagination & Rows-Per-Page Controls */}
          {!loading && filteredCategories.length > 0 && (
            <AdminTablePagination
              page={page}
              pageSize={pageSize}
              totalLoaded={filteredCategories.length}
              pageSizeAriaLabel="Categories per page"
              summary={<>{filteredCategories.length} total {filteredCategories.length === 1 ? "category" : "categories"}</>}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          )}
        </AdminTableSurface>
      )}

      {/* CREATE / EDIT CATEGORY MODAL DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900 text-lg">
                  {formData.icon || "🥞"}
                </span>
                <h2 className="text-lg font-bold text-[#211a14]">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name & Slug */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cat-name" className="text-xs font-semibold text-zinc-800">
                    Category Name *
                  </Label>
                  <Input
                    id="cat-name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Beverages &amp; Shakes, Sides, Kids Stacks"
                    className="mt-1 text-xs h-9 rounded-xl border-zinc-300"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cat-slug" className="text-xs font-semibold text-zinc-800">
                      URL Slug *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setAutoSlug(true)}
                      className="text-[10px] text-amber-800 hover:underline font-medium"
                    >
                      Reset from Name
                    </button>
                  </div>
                  <Input
                    id="cat-slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    placeholder="e.g. beverages, sides, kids-stacks"
                    className="mt-1 text-xs h-9 font-mono rounded-xl border-zinc-300"
                    required
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Used in query links e.g. /menu?category={formData.slug || "slug"}
                  </span>
                </div>
              </div>

              {/* Icon / Emoji Picker */}
              <div>
                <Label className="text-xs font-semibold text-zinc-800">
                  Icon / Emoji *
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl border border-amber-200">
                    {formData.icon || "🥞"}
                  </div>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                    placeholder="Type emoji..."
                    maxLength={10}
                    className="w-28 text-center text-base h-10 rounded-xl border-zinc-300"
                  />
                </div>

                <div className="mt-2.5">
                  <span className="text-[11px] font-medium text-zinc-500 block mb-1.5">
                    Quick Pick:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-zinc-100 bg-zinc-50">
                    {PRESET_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                        className={`h-8 w-8 text-base rounded-md flex items-center justify-center transition-transform hover:scale-115 ${
                          formData.icon === emoji
                            ? "bg-amber-200 border border-amber-400 shadow-2xs"
                            : "hover:bg-white"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="cat-desc" className="text-xs font-semibold text-zinc-800">
                  Description (Optional)
                </Label>
                <Textarea
                  id="cat-desc"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Short culinary description shown on boards or staff notes..."
                  rows={2}
                  className="mt-1 text-xs rounded-xl border-zinc-300"
                />
              </div>

              {/* Order & Active Status */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <Label className="text-xs font-semibold text-zinc-800">
                    Menu Position
                  </Label>
                  <div className="mt-1 h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 flex items-center text-xs font-bold text-zinc-700">
                    {editingCategory
                      ? `Position ${orderedCategories.findIndex((item) => item.id === editingCategory.id) + 1}`
                      : "Added at the end"}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Use the arrows in the category table to change it.
                  </span>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-zinc-800">
                    Visibility
                  </Label>
                  <div className="flex items-center gap-2 mt-2.5">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(val) =>
                        setFormData((prev) => ({ ...prev, is_active: val }))
                      }
                    />
                    <span className="font-semibold text-zinc-700">
                      {formData.is_active ? "Visible on Storefront" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-lg px-4"
                >
                  {submitting
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
