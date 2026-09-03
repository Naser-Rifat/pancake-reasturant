"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Phone,
  X,
  Search,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Mail,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Ban,
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { Pagination } from "@/components/admin/Pagination";

const PAGE_SIZE = 12; // mirrors the backend's DRF PAGE_SIZE
const FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;
const POLL_MS = 20_000;

// Two-tone chime for new incoming booking requests
function newBookingChime() {
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

const EMPTY_PHONE_BOOKING = {
  name: "",
  phone: "",
  email: "",
  date: "",
  time: "",
  party_size: "2",
  notes: "",
};

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
              title: fresh.length === 1 ? "New table booking request 📅" : `${fresh.length} new booking requests 📅`,
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
            ? `${b.name}’s booking confirmed! Confirmation email dispatched.`
            : `${b.name}’s booking cancelled.`,
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
        title: `Phone booking for ${form.name} confirmed!`,
        description: form.email ? `Confirmation email dispatched to ${form.email}` : undefined,
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

  // Statistics
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const totalGuests = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.party_size || 0), 0);

  // Helper for 12h time format
  const formatTime12h = (t: string) => {
    if (!t) return "";
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${mStr || "00"} ${ampm}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-linear-to-r from-[#fffdf9] via-[#fcf6ee] to-[#faf0e1] border-2 border-[#eee3d5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-[#763a12] text-white uppercase tracking-wider shadow-2xs">
            <CalendarDays className="h-3 w-3 text-amber-300" />
            TABLE RESERVATIONS &amp; GUESTS
          </div>
          <h1 className="text-2xl font-black text-[#211a14] tracking-tight">
            Booking Management Portal
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Review incoming table requests, confirm reservations, record phone bookings, and manage seating capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            className="border-[#d9c7b4] text-[#763a12] bg-white hover:bg-[#faf5ee] text-xs font-bold rounded-2xl h-10 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={() => {
              setAdding(true);
              setError("");
            }}
            className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 px-5 h-10 rounded-2xl shadow-md shrink-0 transition-transform active:scale-95"
          >
            <Phone className="h-4 w-4" />
            <span>+ Add Phone Booking</span>
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 [&>*]:min-w-0">
        <div className="p-4 rounded-2xl border-2 border-[#eee3d5] bg-[#fffdf9] shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Records</span>
            <div className="text-2xl font-black text-[#211a14]">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${bookings.length} Bookings`}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100/80 text-[#763a12] flex items-center justify-center font-bold text-lg">
            📅
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border-2 shadow-2xs flex items-center justify-between transition-all ${
            pendingCount > 0 ? "border-amber-300 bg-amber-50/70" : "border-[#eee3d5] bg-[#fffdf9]"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Needs Action</span>
            <div className="text-2xl font-black text-amber-950 flex items-center gap-2">
              {loading ? (
                <Skeleton className="h-7 w-20 rounded-lg" />
              ) : (
                <>
                  {pendingCount} Pending
                  {pendingCount > 0 && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-lg">
            ⏳
          </div>
        </div>

        <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Confirmed</span>
            <div className="text-2xl font-black text-emerald-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${confirmedCount} Approved`}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-lg">
            ✅
          </div>
        </div>

        <div className="p-4 rounded-2xl border-2 border-[#eee3d5] bg-[#fffdf9] shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Confirmed Guests</span>
            <div className="text-2xl font-black text-[#763a12]">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${totalGuests} Guests`}
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
        <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#763a12] shadow-xl space-y-6 ring-4 ring-[#763a12]/10">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#eee3d5]">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#763a12] text-white uppercase tracking-wider">
                📞 STAFF PHONE RESERVATION
              </div>
              <h3 className="text-lg font-black text-[#211a14]">Take Instant Phone Booking</h3>
              <p className="text-xs text-zinc-500">
                Direct phone reservation. Automatically marked as <strong>Confirmed</strong> on save.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAdding(false)}
              aria-label="Close form"
              className="rounded-xl hover:bg-zinc-100"
            >
              <X className="h-5 w-5 text-zinc-500" />
            </Button>
          </div>

          <form onSubmit={submitPhoneBooking} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="pb-name" className="text-xs font-black text-[#211a14]">
                  Guest Full Name *
                </Label>
                <Input
                  id="pb-name"
                  required
                  className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  placeholder="e.g. Sarah Jenkins"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pb-phone" className="text-xs font-black text-[#211a14]">
                  Contact Phone Number *
                </Label>
                <Input
                  id="pb-phone"
                  required
                  type="tel"
                  className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  placeholder="04xx xxx xxx"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="pb-email" className="text-xs font-black text-[#211a14]">
                  Email Address (Optional — sends confirmation email)
                </Label>
                <Input
                  id="pb-email"
                  type="email"
                  className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  placeholder="sarah@example.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pb-party" className="text-xs font-black text-[#211a14]">
                  Party Size (Guests) *
                </Label>
                <Select
                  id="pb-party"
                  className="h-10 text-xs border-[#d9c7b4] font-bold rounded-xl"
                  value={form.party_size}
                  onChange={set("party_size")}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Guest (Solo)" : `${n} Guests`}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pb-date" className="text-xs font-black text-[#211a14]">
                  Reservation Date *
                </Label>
                <Input
                  id="pb-date"
                  required
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  value={form.date}
                  onChange={set("date")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pb-time" className="text-xs font-black text-[#211a14]">
                  Arrival Time *
                </Label>
                <Input
                  id="pb-time"
                  required
                  type="time"
                  className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                  value={form.time}
                  onChange={set("time")}
                />
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="pb-notes" className="text-xs font-black text-[#211a14]">
                  Table Request &amp; Dietary Notes
                </Label>
                <Input
                  id="pb-notes"
                  className="border-[#d9c7b4] text-[#211a14] font-medium text-xs h-10 rounded-xl"
                  placeholder="e.g. Birthday celebration, window booth requested, highchair needed"
                  value={form.notes}
                  onChange={set("notes")}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eee3d5]">
              <Button
                type="button"
                variant="ghost"
                className="text-xs font-bold text-zinc-600 rounded-xl"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Confirmed Booking
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEARCH & STATUS FILTER BAR                                                */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#fffdf9] border-2 border-[#eee3d5] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              className="pl-10 h-11 text-xs font-bold border-[#d9c7b4] rounded-2xl bg-white text-[#211a14] placeholder:text-zinc-400"
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
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#eee3d5]">
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                  isSelected
                    ? "bg-[#763a12] text-white shadow-xs scale-[1.02]"
                    : "bg-white text-[#211a14] border border-[#d9c7b4] hover:bg-[#faf5ee]"
                }`}
              >
                <span>{f === "pending" ? "⏳" : f === "confirmed" ? "✅" : f === "cancelled" ? "❌" : "📅"}</span>
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
      <div className="bg-[#fffdf9] rounded-3xl border-2 border-[#eee3d5] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={8} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-4xl">📅</div>
            <h3 className="text-base font-black text-[#211a14]">No reservations found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No bookings matched your filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#eee3d5] bg-[#faf5ee]/80 text-[#763a12] text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4">Guest Info</th>
                  <th className="py-3.5 px-3">Date &amp; Arrival</th>
                  <th className="py-3.5 px-3 text-center">Party Size</th>
                  <th className="py-3.5 px-4">Requests &amp; Favourites</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee3d5] text-xs font-medium text-[#211a14] [&>tr>td]:align-top">
                {pageBookings.map((b) => (
                  <tr key={b.public_id} className="hover:bg-[#fcf8f2] transition-colors">
                    {/* Guest Name & Contact */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="space-y-0.5">
                        <div className="font-black text-sm text-[#211a14] whitespace-nowrap">{b.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                          {b.email && (
                            <span className="flex items-center gap-1 text-zinc-600">
                              <Mail className="h-3 w-3 text-blue-500" />
                              {b.email}
                            </span>
                          )}
                          {b.phone && (
                            <a
                              href={`tel:${b.phone}`}
                              className="flex items-center gap-1 text-[#763a12] font-bold hover:underline"
                            >
                              <Phone className="h-3 w-3 text-emerald-600" />
                              {b.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-black text-xs text-[#211a14]">
                          {new Date(`${b.date}T00:00:00`).toLocaleDateString("en-AU", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] font-bold text-[#763a12] bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                          {formatTime12h(b.time)}
                        </div>
                      </div>
                    </td>

                    {/* Party Size */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-[#763a12] border border-amber-200">
                        <Users className="h-3 w-3" />
                        {b.party_size} {b.party_size === 1 ? "Guest" : "Guests"}
                      </span>
                    </td>

                    {/* Favourites & Notes */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-1">
                        {b.preselected_dish && (
                          <div className="flex flex-wrap gap-1">
                            {b.preselected_dish.split(", ").map((d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf5ee] border border-[#ecdac7] text-[#763a12]"
                              >
                                🥞 {d}
                              </span>
                            ))}
                          </div>
                        )}
                        {b.notes ? (
                          <p className="text-[11px] text-zinc-600 line-clamp-2 italic">
                            &ldquo;{b.notes}&rdquo;
                          </p>
                        ) : !b.preselected_dish ? (
                          <span className="text-zinc-400 text-[11px]">—</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          b.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                            : b.status === "pending"
                            ? "bg-amber-100 text-amber-950 border border-amber-300 animate-pulse"
                            : "bg-rose-100 text-rose-950 border border-rose-300"
                        }`}
                      >
                        {b.status === "confirmed" ? "✓ Confirmed" : b.status === "pending" ? "⏳ Pending" : "✕ Cancelled"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status !== "confirmed" && (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                            onClick={() => setStatus(b, "confirmed")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                          </Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => setStatus(b, "cancelled")}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
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
