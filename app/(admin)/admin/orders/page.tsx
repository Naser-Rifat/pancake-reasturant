"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingBag,
  ChefHat,
  Bell,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Search,
  RefreshCw,
  AlertCircle,
  DollarSign,
  X,
  ArrowRight,
  Ban,
  Receipt,
  Utensils,
  Check,
} from "lucide-react";
import {
  listOrdersPage,
  mergeRows,
  updateOrder,
  type AdminOrder,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { ORDER_STATUSES, STATUS_BADGE } from "../status";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { Pagination } from "@/components/admin/Pagination";

const PAGE_SIZE = 12; // mirrors the backend's DRF PAGE_SIZE

const FILTERS = ["all", ...ORDER_STATUSES] as const;
const POLL_MS = 15_000;

// Two short rising beeps for new incoming takeaway orders
function newOrderChime() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 880 : 1320;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.16);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* audio blocked until first user interaction — safe fallback */
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const knownIds = useRef<Set<string> | null>(null);
  const nextPage = useRef(2);
  const { toast } = useToast();
  const { promptText, confirm: confirmDialog } = useConfirm();

  const load = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const page = await listOrdersPage(1);
        if (knownIds.current !== null) {
          const fresh = page.results.filter((o) => !knownIds.current!.has(o.public_id));
          if (fresh.length > 0) {
            newOrderChime();
            toast({
              variant: "info",
              title: fresh.length === 1 ? "New order received" : `${fresh.length} new orders received`,
              description: fresh.map((o) => `${o.customer_name} · $${o.total}`).join(", "),
            });
          }
        } else {
          knownIds.current = new Set();
        }
        page.results.forEach((o) => knownIds.current!.add(o.public_id));
        setOrders((prev) => mergeRows(prev, page.results));
        if (nextPage.current === 2) setHasMore(page.hasMore);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await listOrdersPage(nextPage.current);
      nextPage.current += 1;
      page.results.forEach((o) => knownIds.current?.add(o.public_id));
      setOrders((prev) => mergeRows(prev, page.results));
      setHasMore(page.hasMore);
    } catch (e) {
      toast({
        variant: "error",
        title: "Could not load older orders",
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const setStatus = async (o: AdminOrder, status: AdminOrder["status"]) => {
    let cancel_reason = o.cancel_reason;
    if (status === "cancelled") {
      const input = await promptText({
        title: `Cancel ${o.customer_name}’s order?`,
        description: "The cancellation message below will be emailed to the customer immediately.",
        label: "Reason for Cancellation",
        placeholder: "e.g. We have sold out of the Berry Bliss Stack today — our sincere apologies!",
        initial: cancel_reason || "",
        confirmLabel: "Cancel Order",
        cancelLabel: "Keep Order Active",
        destructive: true,
      });
      if (input === null) return;
      cancel_reason = input;
    }
    const prev = orders;
    setOrders((os) =>
      os.map((x) => (x.public_id === o.public_id ? { ...x, status, cancel_reason } : x))
    );
    try {
      await updateOrder(o.public_id, { status, cancel_reason });
      toast({
        variant: "success",
        title:
          status === "cancelled"
            ? "Order cancelled — customer notified with reason"
            : status === "ready"
            ? `Order for ${o.customer_name} marked ready — customer notified`
            : status === "completed"
            ? `Order for ${o.customer_name} marked completed`
            : `Order moved to ${status}`,
      });
    } catch (e) {
      setOrders(prev);
      toast({
        variant: "error",
        title: "Status update failed",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  // Filtered & Searched Orders
  const filteredOrders = useMemo(() => {
    const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((o) => {
      const itemsMatch = o.items.some((i) => i.name.toLowerCase().includes(q));
      return (
        o.customer_name.toLowerCase().includes(q) ||
        (o.phone && o.phone.includes(q)) ||
        (o.email && o.email.toLowerCase().includes(q)) ||
        o.public_id.toLowerCase().includes(q) ||
        o.total.includes(q) ||
        itemsMatch
      );
    });
  }, [orders, filter, searchQuery]);

  // numbered pagination over the filtered rows; stepping past the last loaded
  // page pulls the next batch from the server until it runs dry
  const knownPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);
  useEffect(() => {
    if (page <= knownPages || loadingMore) return;
    if (hasMore) void loadMore();
    else setPage(knownPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, knownPages, hasMore, loadingMore]);
  const pageOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Real-Time Kitchen Metrics
  const receivedCount = orders.filter((o) => o.status === "received").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  // today's takings from the loaded window — matches the dashboard's
  // "Revenue today" (an all-time sum here would lie: only ~24 newest orders
  // are loaded at a time)
  const todayKey = new Date().toDateString();
  const todaysSalesRevenue = orders
    .filter((o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === todayKey)
    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#211a14] tracking-tight">
            Orders
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            New orders appear automatically with a chime. Move each order through prep, ready and pickup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            className="border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 text-xs font-bold rounded-lg h-10 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Orders
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 [&>*]:min-w-0">
        {/* Total Sales */}
        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Today&apos;s Sales</span>
            <div className="text-2xl font-semibold text-[#763a12]">
              {loading ? <Skeleton className="h-7 w-24 rounded-lg" /> : `$${todaysSalesRevenue.toFixed(2)}`}
            </div>
          </div>
          
        </div>

        {/* Received / New */}
        <div
          className={`p-4 rounded-lg border shadow-2xs flex items-center justify-between transition-all ${
            receivedCount > 0 ? "border-amber-300 bg-amber-50/80" : "border-zinc-200 bg-white"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">New Received</span>
            <div className="text-2xl font-semibold text-amber-950 flex items-center gap-2">
              {loading ? (
                <Skeleton className="h-7 w-20 rounded-lg" />
              ) : (
                <>
                  {receivedCount}
                  {receivedCount > 0 && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  )}
                </>
              )}
            </div>
          </div>
          
        </div>

        {/* In Kitchen Preparing */}
        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wide">In Kitchen</span>
            <div className="text-2xl font-semibold text-orange-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${preparingCount}`}
            </div>
          </div>
          
        </div>

        {/* Ready for Pickup */}
        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">Ready for Pickup</span>
            <div className="text-2xl font-semibold text-emerald-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${readyCount}`}
            </div>
          </div>
          
        </div>
      </div>

      {error && <AdminError message={error} onRetry={() => load(true)} />}

      {/* ========================================================================= */}
      {/* SEARCH & STATUS FILTER BAR                                                */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              className="pl-10 h-11 text-xs font-bold border-zinc-300 rounded-lg bg-white text-[#211a14] placeholder:text-zinc-400"
              placeholder="Search by customer name, phone, order ID, or ordered dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-xs font-bold text-zinc-500 shrink-0">
            Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200">
          {FILTERS.map((f) => {
            const isSelected = filter === f;
            const count =
              f === "all"
                ? orders.length
                : orders.filter((o) => o.status === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  isSelected
                    ? "bg-[#763a12] text-white shadow-xs"
                    : "bg-white text-[#211a14] border border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <span>{f}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ORDERS TABLE & KITCHEN ACTION SYSTEM                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            
            <h3 className="text-base font-semibold text-[#211a14]">No orders found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No orders matched your filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-white text-[#763a12] text-[11px] font-semibold uppercase tracking-wide">
                  <th className="py-3.5 px-4">Order &amp; Customer</th>
                  <th className="py-3.5 px-4">Ordered Items &amp; Notes</th>
                  <th className="py-3.5 px-3">Total Amount</th>
                  <th className="py-3.5 px-3">Placed Time</th>
                  <th className="py-3.5 px-3 text-center">Order Status</th>
                  <th className="py-3.5 px-3 text-center">Next Step</th>
                  <th className="py-3.5 px-4 text-right">Set Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-medium text-[#211a14] [&>tr>td]:align-top">
                {pageOrders.map((o) => {
                  const placedDate = new Date(o.created_at);
                  const orderRef = o.public_id ? o.public_id.slice(0, 8).toUpperCase() : "";
                  return (
                    <tr key={o.public_id} className="hover:bg-zinc-50 transition-colors">
                      {/* Customer Info & Order Reference */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            {orderRef && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                #{orderRef}
                              </span>
                            )}
                            <span className="font-semibold text-sm text-[#211a14]">{o.customer_name}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                            {o.phone ? (
                              <a
                                href={`tel:${o.phone}`}
                                className="flex items-center gap-1 text-[#763a12] font-bold hover:underline"
                              >
                                <Phone className="h-3 w-3 text-emerald-600" />
                                {o.phone}
                              </a>
                            ) : o.email ? (
                              <span className="flex items-center gap-1 text-zinc-600">
                                <Mail className="h-3 w-3 text-blue-500" />
                                {o.email}
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items Ordered & Notes */}
                      <td className="py-3.5 px-4 min-w-[280px] max-w-md">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {o.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-[#763a12] shadow-2xs"
                              >
                                <span className="text-amber-800 font-extrabold">{item.quantity}×</span>
                                <span>{item.name}</span>
                              </span>
                            ))}
                          </div>
                          {/* Customer Kitchen Notes */}
                          {o.notes && (
                            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] font-bold flex items-start gap-1.5">
                              
                              <span className="line-clamp-2">
                                <strong>Guest Note:</strong> &ldquo;{o.notes}&rdquo;
                              </span>
                            </div>
                          )}
                          {/* Cancellation Reason */}
                          {o.status === "cancelled" && o.cancel_reason && (
                            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-bold flex items-start gap-1.5">
                              
                              <span>
                                <strong>Cancellation Reason:</strong> &ldquo;{o.cancel_reason}&rdquo;
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#763a12] px-2.5 py-1 rounded-xl bg-white border border-zinc-200">
                          ${o.total}
                        </span>
                      </td>

                      {/* Placed At */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-zinc-600">
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-[#211a14]">
                            {placedDate.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {placedDate.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            o.status === "received"
                              ? "bg-amber-100 text-amber-950 border border-amber-300"
                              : o.status === "preparing"
                              ? "bg-orange-100 text-orange-950 border border-orange-300"
                              : o.status === "ready"
                              ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                              : o.status === "completed"
                              ? "bg-zinc-100 text-zinc-700 border border-zinc-300"
                              : "bg-rose-100 text-rose-950 border border-rose-300"
                          }`}
                        >
                          {o.status === "received"
                            ? "Received"
                            : o.status === "preparing"
                            ? "Preparing"
                            : o.status === "ready"
                            ? "Ready"
                            : o.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                        </span>
                      </td>

                      {/* One-Tap Kitchen Flow Action */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {o.status === "received" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs"
                            onClick={() => setStatus(o, "preparing")}
                          >
                            <ChefHat className="h-3.5 w-3.5 mr-1" /> Start Prep
                          </Button>
                        ) : o.status === "preparing" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                            onClick={() => setStatus(o, "ready")}
                          >
                            <Bell className="h-3.5 w-3.5 mr-1" /> Mark Ready
                          </Button>
                        ) : o.status === "ready" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl shadow-xs"
                            onClick={() => setStatus(o, "completed")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Complete
                          </Button>
                        ) : (
                          <span className="text-zinc-300 font-bold">—</span>
                        )}
                      </td>

                      {/* Manual Status Override */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Select
                          aria-label={`Status of ${o.customer_name}'s order`}
                          className="h-8 text-xs border-zinc-300 font-bold rounded-xl w-28 bg-white"
                          value={o.status}
                          onChange={(e) => setStatus(o, e.target.value as AdminOrder["status"])}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered pagination */}
        {!loading && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalLoaded={filteredOrders.length}
            serverHasMore={hasMore}
            loading={loadingMore}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
