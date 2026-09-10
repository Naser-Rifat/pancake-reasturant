"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TicketPercent,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Copy,
  Check,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle,
  Tag,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  type AdminCoupon,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";

type CouponFilter = "all" | "active" | "inactive" | "exhausted";

interface NewCouponForm {
  code: string;
  kind: "percent" | "fixed";
  value: string;
  min_subtotal: string;
  max_discount: string;
  usage_limit: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  description: string;
}

const EMPTY_FORM: NewCouponForm = {
  code: "",
  kind: "percent",
  value: "20",
  min_subtotal: "0",
  max_discount: "",
  usage_limit: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
  description: "",
};

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewCouponForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Locked coupon IDs during async mutations
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const { toast } = useToast();
  const { confirm: confirmDialog } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listCoupons()
      .then((data) => {
        setCoupons(data);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load coupons");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPending = (id: number, active: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ variant: "info", title: `Copied "${code}" to clipboard` });
  };

  const handleToggleActive = async (coupon: AdminCoupon, is_active: boolean) => {
    if (pendingIds.has(coupon.id)) return;
    const prev = coupons;
    markPending(coupon.id, true);
    setCoupons((list) =>
      list.map((c) => (c.id === coupon.id ? { ...c, is_active } : c))
    );

    try {
      await updateCoupon(coupon.id, { is_active });
      toast({
        variant: "success",
        title: is_active
          ? `Coupon ${coupon.code} activated`
          : `Coupon ${coupon.code} deactivated`,
      });
    } catch (err) {
      setCoupons(prev);
      toast({
        variant: "error",
        title: "Could not update coupon",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      markPending(coupon.id, false);
    }
  };

  const handleDelete = async (coupon: AdminCoupon) => {
    if (pendingIds.has(coupon.id)) return;

    const confirmed = await confirmDialog({
      title: `Delete coupon ${coupon.code}?`,
      description:
        coupon.times_used > 0
          ? `This coupon has already been redeemed ${coupon.times_used} time(s). Redemptions cannot be deleted from sales records, but you can deactivate it instead.`
          : "Are you sure you want to delete this coupon? This action cannot be undone.",
      confirmLabel: "Delete Coupon",
      destructive: true,
    });

    if (!confirmed) return;

    markPending(coupon.id, true);
    try {
      await deleteCoupon(coupon.id);
      setCoupons((list) => list.filter((c) => c.id !== coupon.id));
      toast({ variant: "success", title: `Coupon ${coupon.code} deleted` });
    } catch (err) {
      toast({
        variant: "error",
        title: "Cannot delete coupon",
        description:
          err instanceof Error
            ? err.message
            : "This coupon is linked to existing order history. Deactivate it instead.",
      });
    } finally {
      markPending(coupon.id, false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = form.code.trim().toUpperCase();
    if (!cleanCode) {
      toast({ variant: "error", title: "Coupon code is required" });
      return;
    }
    const valNum = parseFloat(form.value);
    if (isNaN(valNum) || valNum <= 0) {
      toast({ variant: "error", title: "Enter a valid positive discount amount" });
      return;
    }
    if (form.kind === "percent" && valNum > 100) {
      toast({ variant: "error", title: "Percentage discount cannot exceed 100%" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: cleanCode,
        kind: form.kind,
        value: form.value,
        min_subtotal: form.min_subtotal ? parseFloat(form.min_subtotal) : 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
        description: form.description.trim(),
      };

      const created = await createCoupon(payload);
      setCoupons((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast({
        variant: "success",
        title: `Coupon ${created.code} created!`,
        description: `Customers can now use code ${created.code} for ${created.discount_label}.`,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Failed to create coupon",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalCount = coupons.length;
    const activeCount = coupons.filter((c) => c.is_active && !c.is_exhausted).length;
    const totalRedeemed = coupons.reduce((sum, c) => sum + (c.times_used || 0), 0);
    const percentCount = coupons.filter((c) => c.kind === "percent").length;
    return { totalCount, activeCount, totalRedeemed, percentCount };
  }, [coupons]);

  // Filtered & Searched coupons
  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === "active") return c.is_active && !c.is_exhausted;
      if (filter === "inactive") return !c.is_active;
      if (filter === "exhausted") return c.is_exhausted;
      return true;
    });
  }, [coupons, searchQuery, filter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#211a14] flex items-center gap-2.5">
            <TicketPercent className="h-7 w-7 text-[#763a12]" />
            Coupons &amp; Deals
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create discount codes, set spending limits, and track redemption numbers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-xl bg-[#763a12] hover:bg-[#5e2d0d] text-white shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {showForm ? "Close Form" : "Create Coupon"}
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Total Coupons</span>
            <Tag className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-[#211a14] mt-2">
            {stats.totalCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Configured in database</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Active &amp; Usable</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {stats.activeCount}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Ready for checkout</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Total Redemptions</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 mt-2">
            {stats.totalRedeemed}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Orders with discount applied</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Discount Types</span>
            <Percent className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#211a14] mt-2">
            {stats.percentCount} <span className="text-xs font-medium text-zinc-400">percent / {stats.totalCount - stats.percentCount} fixed</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Promo breakdown</div>
        </div>
      </div>

      {/* New Coupon Form Drawer/Panel */}
      {showForm && (
        <div className="p-6 rounded-2xl bg-white border-2 border-amber-200 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#211a14] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#763a12]" /> Create New Discount Code
              </h2>
              <p className="text-xs text-zinc-500">
                The code is priced and locked on the server so Stripe charges match the discount preview.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Coupon Code *
                </label>
                <Input
                  required
                  placeholder="e.g. WELCOME20"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, "") })
                  }
                  className="font-mono font-bold tracking-wider uppercase"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Uppercase letters and numbers (spaces auto-removed)
                </p>
              </div>

              {/* Discount Kind */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, kind: "percent" })}
                    className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      form.kind === "percent"
                        ? "bg-[#763a12] text-white border-[#763a12]"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <Percent className="h-3.5 w-3.5" /> Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, kind: "fixed" })}
                    className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      form.kind === "fixed"
                        ? "bg-[#763a12] text-white border-[#763a12]"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Fixed ($)
                  </button>
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {form.kind === "percent" ? "Percentage Off (%) *" : "Dollar Amount Off ($) *"}
                </label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={form.kind === "percent" ? "100" : undefined}
                  placeholder={form.kind === "percent" ? "20" : "5.00"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Min Subtotal */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Minimum Order Subtotal ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00 (No minimum)"
                  value={form.min_subtotal}
                  onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Cart must reach this amount before code applies
                </p>
              </div>

              {/* Max Discount (Cap) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Max Discount Dollar Cap ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={form.kind !== "percent"}
                  placeholder={form.kind === "percent" ? "Optional cap (e.g. 50)" : "N/A for fixed discounts"}
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Prevents massive discount on large catering orders
                </p>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Total Redemption Limit
                </label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Unlimited uses"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Leave empty for unlimited claims
                </p>
              </div>
            </div>

            {/* Description & Active toggle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Internal Description / Staff Notes
                </label>
                <Input
                  placeholder="e.g. Social media flyer promo, Spring 2026"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Visible to staff in admin only, never shown to customers
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  Initial Status
                </label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(val) => setForm({ ...form, is_active: val })}
                  />
                  <span className="text-xs font-semibold text-zinc-700">
                    {form.is_active ? "Active immediately" : "Inactive (Draft)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="rounded-xl border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                className="rounded-xl bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold"
              >
                Save &amp; Activate Coupon
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search code or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 border-zinc-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "inactive", "exhausted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                filter === f
                  ? "bg-[#763a12] text-white shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {f === "all" ? "All Coupons" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && <AdminError message={error} onRetry={load} />}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-zinc-200 p-4 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-zinc-200">
          <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <TicketPercent className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#211a14]">
            {searchQuery || filter !== "all" ? "No matching coupons found" : "No coupons created yet"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || filter !== "all"
              ? "Try adjusting your search query or filter."
              : "Set up promotional codes like WELCOME20 to offer discounts to your customers at checkout."}
          </p>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-[#763a12] hover:bg-[#5e2d0d] text-white text-xs font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Your First Coupon
            </Button>
          )}
        </div>
      )}

      {/* Coupons Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[#763a12] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-3">Discount</th>
                  <th className="py-3.5 px-3">Rules &amp; Limits</th>
                  <th className="py-3.5 px-3">Redemptions</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Active</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-medium text-[#211a14]">
                {filtered.map((c) => {
                  const isPending = pendingIds.has(c.id);
                  const isExhausted = c.is_exhausted;
                  const isLive = c.is_active && !isExhausted;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      {/* Code & Description */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-xl bg-amber-50 text-amber-950 border border-amber-200/80 inline-flex items-center gap-1.5">
                              {c.code}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.code)}
                                className="text-amber-700 hover:text-amber-950 transition p-0.5 rounded"
                                title="Copy code"
                              >
                                {copiedCode === c.code ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </span>
                          </div>
                          {c.description ? (
                            <p className="text-[11px] text-zinc-500 line-clamp-1">
                              {c.description}
                            </p>
                          ) : (
                            <p className="text-[10px] text-zinc-400">Created {new Date(c.created_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </td>

                      {/* Discount Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-sm text-[#763a12]">
                          {c.discount_label}
                        </span>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
                          {c.kind === "percent" ? "Percentage" : "Fixed dollar"}
                        </div>
                      </td>

                      {/* Rules & Limits */}
                      <td className="py-3.5 px-3 min-w-[170px]">
                        <div className="space-y-0.5 text-[11px]">
                          {parseFloat(c.min_subtotal) > 0 ? (
                            <div className="text-zinc-600">
                              Min order: <span className="font-bold">${c.min_subtotal}</span>
                            </div>
                          ) : (
                            <div className="text-zinc-400">No min spend</div>
                          )}

                          {c.max_discount && (
                            <div className="text-amber-800">
                              Cap: max ${c.max_discount} off
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Redemptions / Times used */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-bold text-xs">
                            {c.times_used}{" "}
                            <span className="text-zinc-400 font-normal">
                              {c.usage_limit ? `/ ${c.usage_limit} uses` : "uses"}
                            </span>
                          </div>
                          {c.usage_limit && (
                            <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isExhausted ? "bg-rose-500" : "bg-[#763a12]"
                                }`}
                                style={{
                                  width: `${Math.min(100, (c.times_used / c.usage_limit) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Chip */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isExhausted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
                            Exhausted
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ● Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Active Switch Toggle */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <Switch
                          checked={c.is_active}
                          disabled={isPending}
                          onCheckedChange={(checked) => handleToggleActive(c, checked)}
                          aria-label={`Toggle active for ${c.code}`}
                        />
                      </td>

                      {/* Delete action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDelete(c)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                          title="Delete coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
