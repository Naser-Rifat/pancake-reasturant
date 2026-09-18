"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Phone,
  X,
  Search,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  createAdminBooking,
  listBookingsPage,
  mergeRows,
  updateBooking,
  type AdminBooking,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { AdminDataTable, AdminTablePagination, AdminTableSurface, type AdminTableColumn } from "@/components/admin/AdminTable";
import { useRowFocus } from "@/components/admin/use-row-focus";

import { BookingRow } from "./_components/BookingRow";
import { formatTime12h } from "./_lib";
import { PhoneBookingModal } from "./_components/PhoneBookingModal";
import { matchesBookingRef } from "@/lib/order-utils";
import {
  EMPTY_PHONE_BOOKING,
  FILTERS,
  PAGE_SIZE,
  POLL_MS,
  newBookingChime,
} from "./_lib";

const BOOKING_COLUMNS: AdminTableColumn<AdminBooking>[] = [
  { id: "guest", header: "Guest Info", headerClassName: "py-3.5 px-4" },
  { id: "arrival", header: "Date & Arrival", headerClassName: "py-3.5 px-3" },
  { id: "party", header: "Party Size", headerClassName: "py-3.5 px-3 text-center" },
  { id: "requests", header: "Requests & Favourites", headerClassName: "py-3.5 px-4" },
  { id: "status", header: "Status", headerClassName: "py-3.5 px-3 text-center" },
  { id: "actions", header: "Actions", headerClassName: "py-3.5 px-4 text-right" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_PHONE_BOOKING);
  const { toast } = useToast();
  const { confirm: confirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const refreshBookings = () =>
    queryClient.invalidateQueries({ queryKey: ["admin"] });

  const tableRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const nextPage = useRef(2);

  const bookingsQuery = useQuery({
    queryKey: ["admin", "bookings", filter],
    queryFn: () => listBookingsPage(1, filter === "all" ? undefined : filter),
    refetchInterval: POLL_MS,
  });
  useEffect(() => {
    const result = bookingsQuery.data;
    if (!result) return;
    const fresh = knownIds.current
      ? result.results.filter(
          (booking) => booking.status === "pending" && !knownIds.current!.has(booking.public_id),
        )
      : [];
    if (fresh.length > 0) {
      newBookingChime();
      toast({
        variant: "info",
        title: fresh.length === 1 ? "New booking request" : `${fresh.length} new booking requests`,
        description: fresh.map((booking) => `${booking.name} · ${booking.date} ${booking.time.slice(0, 5)}`).join(", "),
      });
    }
    if (knownIds.current === null) knownIds.current = new Set();
    result.results.forEach((booking) => knownIds.current!.add(booking.public_id));
    setBookings((previous) => mergeRows(previous, result.results));
    if (nextPage.current === 2) setHasMore(result.hasMore);
  }, [bookingsQuery.data, toast]);
  const loading = bookingsQuery.isPending;
  const error = bookingsQuery.error instanceof Error ? bookingsQuery.error.message : "";
  const load = () => void bookingsQuery.refetch();
  const loadingMore =
    useIsFetching({ queryKey: ["admin", "bookings", "page"] }) > 0;

  const loadMore = async () => {
    try {
      const pageNumber = nextPage.current;
      const page = await queryClient.fetchQuery({
        queryKey: ["admin", "bookings", "page", filter, pageNumber],
        queryFn: () =>
          listBookingsPage(
            pageNumber,
            filter === "all" ? undefined : filter,
          ),
        staleTime: 0,
      });
      nextPage.current += 1;
      page.results.forEach((b) => knownIds.current?.add(b.public_id));
      setBookings((prev) => mergeRows(prev, page.results));
      setHasMore(page.hasMore);
    } catch (e) {
      toast({
        variant: "error",
        title: "Could not load older bookings",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  useEffect(() => {
    setBookings([]);
    nextPage.current = 2;
    setHasMore(false);
    knownIds.current = null;
  }, [filter]);

  // the booking whose status change is in flight — locks that row's buttons
  const [pendingId, setPendingId] = useState<string | null>(null);
  const statusMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateBooking>[1] }) =>
      updateBooking(id, patch),
    onSettled: refreshBookings,
  });
  const createMutation = useMutation({
    mutationFn: createAdminBooking,
    onSettled: refreshBookings,
  });
  const saving = createMutation.isPending;

  const setStatus = async (b: AdminBooking, status: AdminBooking["status"]) => {
    if (pendingId === b.public_id) return;
    // both actions email the guest, so both get a deliberate confirm step —
    // and we never claim an email was sent when there is no address on file
    const when = `${new Date(`${b.date}T00:00:00`).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })} at ${formatTime12h(b.time)} · ${b.party_size} ${b.party_size === 1 ? "guest" : "guests"}`;
    const emailLine = b.email
      ? status === "confirmed"
        ? `A confirmation email goes to ${b.email} right away.`
        : `A cancellation email goes to ${b.email} right away.`
      : `No email on file — please call ${b.phone || "the guest"} to let them know.`;

    const ok = await confirmDialog(
      status === "cancelled"
        ? {
            title: `Cancel ${b.name}’s reservation?`,
            description: `${when}\n${emailLine}`,
            confirmLabel: "Cancel Booking",
            destructive: true,
          }
        : {
            title: `Confirm ${b.name}’s table?`,
            description: `${when}\n${emailLine}`,
            confirmLabel: "Confirm Booking",
          }
    );
    if (!ok) return;

    const prev = bookings;
    setPendingId(b.public_id);
    setBookings((bs) => bs.map((x) => (x.public_id === b.public_id ? { ...x, status } : x)));
    try {
      await statusMutation.mutateAsync({ id: b.public_id, patch: { status } });
      toast({
        variant: "success",
        title:
          status === "confirmed"
            ? `${b.name}’s booking confirmed`
            : `${b.name}’s booking cancelled`,
        description: b.email
          ? `Email sent to ${b.email}`
          : "No email on file — call the guest to let them know",
      });
    } catch (e) {
      setBookings(prev);
      toast({
        variant: "error",
        title: "Update failed",
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  };

  const set = (key: keyof typeof EMPTY_PHONE_BOOKING) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submitPhoneBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        phone: form.phone,
        email: form.email,
        date: form.date,
        time: form.time,
        party_size: Number(form.party_size),
        notes: form.notes,
        status: "confirmed",
      });
      setAdding(false);
      setForm(EMPTY_PHONE_BOOKING);
      load();
      toast({
        variant: "success",
        title: `Phone booking saved for ${form.name}`,
        description: form.email ? `Confirmation email sent to ${form.email}` : undefined,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not save booking",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  // Filtered & Searched Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        matchesBookingRef(b.public_id, q) ||
        b.date.includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        (b.preselected_dish && b.preselected_dish.toLowerCase().includes(q))
      );
    });
  }, [bookings, searchQuery]);

  // numbered pagination over the filtered rows; stepping past the last loaded
  // page pulls the next batch from the server until it runs dry
  const knownPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);
  useEffect(() => {
    if (page <= knownPages || loadingMore) return;
    if (hasMore) void loadMore();
    else setPage(knownPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, knownPages, hasMore, loadingMore]);
  const pageBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);

  // ?focus=<id> from the dashboard feed lands on that exact row
  const { highlightId } = useRowFocus({
    rows: filteredBookings,
    idOf: useCallback((b: AdminBooking) => b.public_id, []),
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
          title: "Booking not in the recent list",
          description: "It may be much older — try the search box instead.",
        }),
      [toast]
    ),
  });

  // Statistics
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const totalGuests = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.party_size || 0), 0);

  // Helper for 12h time format

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#211a14] tracking-tight">
            Bookings
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Confirm incoming table requests and record phone bookings. New requests appear automatically with a chime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 text-xs font-bold rounded-lg h-10 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={() => {
              setAdding(true);
            }}
            className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 px-5 h-10 rounded-lg shadow-xs shrink-0 transition-transform"
          >
            <Phone className="h-4 w-4" />
            <span>+ Add Phone Booking</span>
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 [&>*]:min-w-0">
        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Total Records</span>
            <div className="text-2xl font-semibold text-[#211a14]">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${bookings.length}`}
            </div>
          </div>
          
        </div>

        <div
          className={`p-4 rounded-lg border shadow-2xs flex items-center justify-between transition-all ${
            pendingCount > 0 ? "border-amber-300 bg-amber-50/70" : "border-zinc-200 bg-white"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Needs Action</span>
            <div className="text-2xl font-semibold text-amber-950 flex items-center gap-2">
              {loading ? (
                <Skeleton className="h-7 w-20 rounded-lg" />
              ) : (
                <>
                  {pendingCount}
                  {pendingCount > 0 && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  )}
                </>
              )}
            </div>
          </div>
          
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Confirmed</span>
            <div className="text-2xl font-semibold text-emerald-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${confirmedCount}`}
            </div>
          </div>
          
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Confirmed Guests</span>
            <div className="text-2xl font-semibold text-[#763a12]">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${totalGuests}`}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-100 text-[#763a12] flex items-center justify-center font-bold text-lg">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {error && <AdminError message={error} onRetry={load} />}

      {/* ========================================================================= */}
      {/* PHONE BOOKING DRAWER / MODAL CARD                                         */}
      {/* ========================================================================= */}
      {adding && (
        <PhoneBookingModal
          form={form}
          set={set}
          onSubmit={submitPhoneBooking}
          saving={saving}
          onClose={() => setAdding(false)}
        />
      )}

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
              placeholder="Search by guest name, phone, email, date (YYYY-MM-DD), or dish..."
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
            Showing <strong>{filteredBookings.length}</strong> of {bookings.length} reservations
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200">
          {FILTERS.map((f) => {
            const isSelected = filter === f;
            const count =
              f === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === f).length;
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
      {/* BOOKINGS TABLE                                                            */}
      {/* ========================================================================= */}
      <AdminTableSurface ref={tableRef}>
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <h3 className="text-base font-semibold text-[#211a14]">No reservations found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No reservations matched your filter or search query.
            </p>
          </div>
        ) : (
          <AdminDataTable
            rows={pageBookings}
            rowKey={(booking) => booking.public_id}
            columns={BOOKING_COLUMNS}
            bodyClassName="divide-y divide-zinc-100 text-xs font-medium text-[#211a14] [&>tr>td]:align-top"
            renderRow={(booking) => (
              <BookingRow
                b={booking}
                highlighted={highlightId === booking.public_id}
                pending={pendingId === booking.public_id}
                onSetStatus={setStatus}
              />
            )}
          />
        )}

        {/* Numbered pagination */}
        {!loading && filteredBookings.length > 0 && (
          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            totalLoaded={filteredBookings.length}
            serverHasMore={hasMore}
            loading={loadingMore}
            pageSizeAriaLabel="Bookings per page"
            summary={<>Showing {pageBookings.length} of {filteredBookings.length} {filteredBookings.length === 1 ? "booking" : "bookings"}{hasMore ? " (more available on server)" : ""}</>}
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
