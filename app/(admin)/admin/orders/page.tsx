"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Search, RefreshCw, X } from "lucide-react";
import {
  listOrdersPage,
  mergeRows,
  updateOrder,
  type AdminOrder,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { AdminDataTable, AdminTablePagination, AdminTableSurface, type AdminTableColumn } from "@/components/admin/AdminTable";
import { useRowFocus } from "@/components/admin/use-row-focus";

import { FILTERS, PAGE_SIZE, POLL_MS, newOrderChime } from "./_lib";
import { OrderRow } from "./_components/OrderRow";
import { matchesOrderRef } from "@/lib/order-utils";

const ORDER_COLUMNS: AdminTableColumn<AdminOrder>[] = [
  { id: "customer", header: "Order & Customer", headerClassName: "py-3.5 px-4" },
  { id: "items", header: "Ordered Items & Notes", headerClassName: "py-3.5 px-4" },
  { id: "total", header: "Total Amount", headerClassName: "py-3.5 px-3" },
  { id: "placed", header: "Placed Time", headerClassName: "py-3.5 px-3" },
  { id: "status", header: "Order Status", headerClassName: "py-3.5 px-3 text-center" },
  { id: "next", header: "Next Step", headerClassName: "py-3.5 px-3 text-center" },
  { id: "actions", header: "Set Status", headerClassName: "py-3.5 px-4 text-right" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const nextPage = useRef(2);
  const { toast } = useToast();
  const { promptText } = useConfirm();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", "latest"],
    queryFn: () => listOrdersPage(1),
    refetchInterval: POLL_MS,
  });
  useEffect(() => {
    const result = ordersQuery.data;
    if (!result) return;
    if (knownIds.current !== null) {
      const fresh = result.results.filter((order) => !knownIds.current!.has(order.public_id));
      if (fresh.length > 0) {
        newOrderChime();
        toast({
          variant: "info",
          title: fresh.length === 1 ? "New order received" : `${fresh.length} new orders received`,
          description: fresh.map((order) => `${order.customer_name} · $${order.total}`).join(", "),
        });
      }
    } else knownIds.current = new Set();
    result.results.forEach((order) => knownIds.current!.add(order.public_id));
    setOrders((previous) => mergeRows(previous, result.results));
    if (nextPage.current === 2) setHasMore(result.hasMore);
  }, [ordersQuery.data, toast]);
  const loading = ordersQuery.isPending;
  const error = ordersQuery.error instanceof Error ? ordersQuery.error.message : "";
  const load = () => void ordersQuery.refetch();
  const loadingMore =
    useIsFetching({ queryKey: ["admin", "orders", "page"] }) > 0;

  const loadMore = async () => {
    try {
      const pageNumber = nextPage.current;
      const page = await queryClient.fetchQuery({
        queryKey: ["admin", "orders", "page", pageNumber],
        queryFn: () => listOrdersPage(pageNumber),
        staleTime: 0,
      });
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
    }
  };

  // the order whose status change is in flight — its row controls lock so a
  // double-tap can't fire the same transition twice
  const [pendingId, setPendingId] = useState<string | null>(null);
  const statusMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateOrder>[1] }) =>
      updateOrder(id, patch),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  const setStatus = async (o: AdminOrder, status: AdminOrder["status"]) => {
    if (pendingId === o.public_id) return;
    let cancel_reason = o.cancel_reason;
    if (status === "cancelled") {
      const input = await promptText({
        title: `Cancel ${o.customer_name}’s order?`,
        // ---------------------------------------------------------------------
        // TODO: STRIPE PAYMENT SERVICE - UNCOMMENT WHEN RE-ENABLING STRIPE:
        // description:
        //   o.payment_status === "paid"
        //     ? "Their payment will be refunded in full via Stripe, and the cancellation message below will be emailed to the customer immediately."
        //     : "The cancellation message below will be emailed to the customer immediately.",
        // ---------------------------------------------------------------------
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
    setPendingId(o.public_id);
    setOrders((os) =>
      os.map((x) => (x.public_id === o.public_id ? { ...x, status, cancel_reason } : x))
    );
    try {
      await statusMutation.mutateAsync({ id: o.public_id, patch: { status, cancel_reason } });
      toast({
        variant: "success",
        title:
          status === "cancelled"
            ? o.payment_status === "paid"
              ? "Order cancelled & payment refunded — customer notified"
              : "Order cancelled — customer notified with reason"
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
    } finally {
      setPendingId(null);
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
        matchesOrderRef(o.public_id, q) ||
        o.total.includes(q) ||
        itemsMatch
      );
    });
  }, [orders, filter, searchQuery]);

  // numbered pagination over the filtered rows; stepping past the last loaded
  // page pulls the next batch from the server until it runs dry
  const knownPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);
  useEffect(() => {
    if (page <= knownPages || loadingMore) return;
    if (hasMore) void loadMore();
    else setPage(knownPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, knownPages, hasMore, loadingMore]);
  const pageOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  // ?focus=<id> from the dashboard feed lands on that exact row
  const { highlightId } = useRowFocus({
    rows: filteredOrders,
    idOf: useCallback((o: AdminOrder) => o.public_id, []),
    loading,
    loadingMore,
    hasMore,
    loadMore,
    setPage,
    pageSize,
    onMiss: useCallback(
      () =>
        toast({
          variant: "info",
          title: "Order not in the recent list",
          description: "It may be much older — try the search box instead.",
        }),
      [toast]
    ),
  });

  // Real-Time Kitchen Metrics
  const receivedCount = orders.filter((o) => o.status === "received").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;

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
            onClick={load}
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

      {error && <AdminError message={error} onRetry={load} />}

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
      <AdminTableSurface ref={tableRef}>
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
          <AdminDataTable
            rows={pageOrders}
            rowKey={(order) => order.public_id}
            columns={ORDER_COLUMNS}
            bodyClassName="divide-y divide-zinc-100 text-xs font-medium text-[#211a14] [&>tr>td]:align-top"
            renderRow={(order) => (
              <OrderRow
                o={order}
                highlighted={highlightId === order.public_id}
                pending={pendingId === order.public_id}
                onSetStatus={setStatus}
              />
            )}
          />
        )}

        {/* Numbered pagination */}
        {!loading && filteredOrders.length > 0 && (
          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            totalLoaded={filteredOrders.length}
            serverHasMore={hasMore}
            loading={loadingMore}
            pageSizeAriaLabel="Orders per page"
            summary={<>Showing {pageOrders.length} of {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}{hasMore ? " (more available on server)" : ""}</>}
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
