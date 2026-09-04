"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Pagination } from "@/components/admin/Pagination";
import { useRowFocus } from "@/components/admin/use-row-focus";

import { BookingRow } from "./_components/BookingRow";
import { PhoneBookingModal } from "./_components/PhoneBookingModal";
import {
  EMPTY_PHONE_BOOKING,
  FILTERS,
  PAGE_SIZE,
  POLL_MS,
  newBookingChime,
} from "./_lib";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_PHONE_BOOKING);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { confirm: confirmDialog } = useConfirm();

  const knownIds = useRef<Set<string> | null>(null);
  const nextPage = useRef(2);

  const load = useCallback(
    (isInitial = true) => {
      if (isInitial) setLoading(true);
      listBookingsPage(1, filter === "all" ? undefined : filter)
        .then((page) => {
          const fresh = knownIds.current
            ? page.results.filter((b) => b.status === "pending" && !knownIds.current!.has(b.public_id))
            : [];
          if (fresh.length > 0) {
            newBookingChime();
            toast({
              variant: "info",
              title: fresh.length === 1 ? "New booking request" : `${fresh.length} new booking requests`,
              description: fresh.map((b) => `${b.name} · ${b.date} ${b.time.slice(0, 5)}`).join(", "),
            });
          }
          if (knownIds.current === null) knownIds.current = new Set();
          page.results.forEach((b) => knownIds.current!.add(b.public_id));
          setBookings((prev) => mergeRows(prev, page.results));
          if (nextPage.current === 2) setHasMore(page.hasMore);
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load bookings"))
        .finally(() => setLoading(false));
    },
    [filter, toast]
  );

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await listBookingsPage(nextPage.current, filter === "all" ? undefined : filter);
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
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setBookings([]);
    nextPage.current = 2;
    setHasMore(false);
    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const setStatus = async (b: AdminBooking, status: AdminBooking["status"]) => {
    if (status === "cancelled") {
      const ok = await confirmDialog({
        title: `Cancel ${b.name}’s reservation?`,
        description: "A cancellation email will be sent to the guest immediately.",
        confirmLabel: "Cancel Booking",
        destructive: true,
      });
      if (!ok) return;
    }

    const prev = bookings;
    setBookings((bs) => bs.map((x) => (x.public_id === b.public_id ? { ...x, status } : x)));
    try {
      await updateBooking(b.public_id, { status });
      toast({
        variant: "success",
        title:
          status === "confirmed"
            ? `${b.name}’s booking confirmed — email sent`
            : `${b.name}’s booking cancelled — guest notified`,
      });
    } catch (e) {
      setBookings(prev);
      toast({
        variant: "error",
        title: "Update failed",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const set = (key: keyof typeof EMPTY_PHONE_BOOKING) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submitPhoneBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createAdminBooking({
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
    } finally {
      setSaving(false);
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
        b.date.includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        (b.preselected_dish && b.preselected_dish.toLowerCase().includes(q))
      );
    });
  }, [bookings, searchQuery]);

  // numbered pagination over the filtered rows; stepping past the last loaded
  // page pulls the next batch from the server until it runs dry
  const knownPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);
  useEffect(() => {
    if (page <= knownPages || loadingMore) return;
    if (hasMore) void loadMore();
    else setPage(knownPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, knownPages, hasMore, loadingMore]);
  const pageBookings = filteredBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ?focus=<id> from the dashboard feed lands on that exact row
  const { highlightId } = useRowFocus({
    rows: filteredBookings,
    idOf: useCallback((b: AdminBooking) => b.public_id, []),
    loading,
    loadingMore,
    hasMore,
    loadMore,
    setPage,
    pageSize: PAGE_SIZE,
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
            onClick={() => load(true)}
            className="border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 text-xs font-bold rounded-lg h-10 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={() => {
              setAdding(true);
              setError("");
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
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={8} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            
            <h3 className="text-base font-semibold text-[#211a14]">No reservations found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No bookings matched your filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-white text-[#763a12] text-[11px] font-semibold uppercase tracking-wide">
                  <th className="py-3.5 px-4">Guest Info</th>
                  <th className="py-3.5 px-3">Date &amp; Arrival</th>
                  <th className="py-3.5 px-3 text-center">Party Size</th>
                  <th className="py-3.5 px-4">Requests &amp; Favourites</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-medium text-[#211a14] [&>tr>td]:align-top">
                {pageBookings.map((b) => (
                  <BookingRow
                    key={b.public_id}
                    b={b}
                    highlighted={highlightId === b.public_id}
                    onSetStatus={setStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered pagination */}
        {!loading && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalLoaded={filteredBookings.length}
            serverHasMore={hasMore}
            loading={loadingMore}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
