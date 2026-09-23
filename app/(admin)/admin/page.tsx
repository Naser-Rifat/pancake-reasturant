"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Plus,
  Phone,
  UtensilsCrossed,
  Sliders,
  TrendingUp,
  Star,
  MessageSquareHeart,
} from "lucide-react";
import {
  getStats,
  listBookings,
  listOrders,
  getSiteSettings,
} from "@/lib/admin-api";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatTime12h, parseBookingOffer } from "@/lib/format";
import { formatOrderRef, formatBookingRef } from "@/lib/order-utils";

function formatOrderTime(dateStr: string | Date) {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatBookingDate(dateStr: string) {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function getDayDiff(dateStr: string): number | null {
  try {
    const target = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [s, o, b, siteRes] = await Promise.all([
        getStats(),
        listOrders(),
        listBookings(),
        getSiteSettings().catch(() => null),
      ]);
      const recentOrders = o.slice(0, 5);
      // the card promises UPCOMING arrivals: nearest future dates first,
      // cancelled and past bookings left out (the API returns newest-request-first)
      const todayISO = new Date().toISOString().slice(0, 10);
      const recentBookings = b
        .filter((x) => x.status !== "cancelled" && x.date >= todayISO)
        .sort((x, y) => `${x.date}T${x.time}`.localeCompare(`${y.date}T${y.time}`))
        .slice(0, 5);
      return { stats: s, recentOrders, recentBookings, site: siteRes };
    },
    refetchInterval: 60_000,
  });

  const { stats, recentOrders = [], recentBookings = [], site } = dashboardQuery.data ?? {};
  const loading = dashboardQuery.isPending;
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "";
  const loadData = () => void dashboardQuery.refetch();

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Operations Welcome Banner */}
      <div className="relative overflow-hidden p-5 sm:p-7 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {site?.online_ordering_enabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online Orders Active
              </span>
            ) : site ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-950 border border-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Ordering Paused
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#211a14] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Today's orders, reservations and pending actions at a glance.
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          <Link
            href="/admin/menu"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center bg-[#763a12] hover:bg-[#5e2d0d] active:scale-[0.98] text-white font-bold text-xs gap-1.5 px-4 h-10 rounded-xl shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Dish</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center justify-center border border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 active:scale-[0.98] text-xs font-bold rounded-xl h-10 px-4 transition-all shadow-2xs"
          >
            <Phone className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            <span>Bookings</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 h-10 rounded-xl border border-zinc-300 bg-white text-[#763a12] hover:bg-zinc-50 active:scale-[0.98] shadow-2xs transition-all"
          >
            <span>Live Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      {error && <AdminError message={error} onRetry={loadData} />}

      {/* 4 Premium Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 [&>*]:min-w-0">
        {/* 1. Today's Revenue */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex flex-col justify-between min-h-[108px]">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Revenue Today</span>
            <div className="text-2xl sm:text-3xl font-semibold text-[#763a12]">
              {loading ? <Skeleton className="h-8 w-24" /> : `$${stats?.revenue_today ?? "0.00"}`}
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-700/80 flex items-center gap-1 pt-1">
            <TrendingUp className="h-3 w-3" /> Live sales today
          </span>
        </div>

        {/* 2. Orders Today */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex flex-col justify-between min-h-[108px]">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Orders Today</span>
            <div className="text-2xl sm:text-3xl font-semibold text-[#211a14]">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.orders_today ?? 0} Orders`}
            </div>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 pt-1">
            Takeaway &amp; counter
          </span>
        </div>

        {/* 3. Pending Bookings */}
        <div
          className={`p-4 sm:p-5 rounded-xl border shadow-2xs flex flex-col justify-between min-h-[108px] transition-all ${
            (stats?.pending_bookings ?? 0) > 0
              ? "border-amber-300 bg-amber-50/80"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Pending Bookings</span>
            <div className="text-2xl sm:text-3xl font-semibold text-amber-950 flex items-center gap-2">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.pending_bookings ?? 0}`}
              {!loading && (stats?.pending_bookings ?? 0) > 0 && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-700/80 pt-1">
            Needs confirmation
          </span>
        </div>

        {/* 4. Pending Reviews */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex flex-col justify-between min-h-[108px]">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Reviews to Moderate</span>
            <div className="text-2xl sm:text-3xl font-semibold text-emerald-950">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.pending_reviews ?? 0}`}
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700/80 pt-1">
            Customer praise
          </span>
        </div>
      </div>

      {stats?.total_orders != null && (
        <div className="p-3 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-zinc-200 text-xs font-medium text-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#763a12]/40 hidden sm:inline-block" />
            <span>
              All-time: <strong className="text-[#211a14] font-semibold">{stats.total_orders.toLocaleString()}</strong> orders ·{" "}
              <strong className="text-[#211a14] font-semibold">{stats.total_bookings.toLocaleString()}</strong> bookings
            </span>
          </div>
          <Link href="/admin/settings" className="text-[#763a12] hover:text-[#5e2d0d] hover:underline inline-flex items-center gap-1 font-semibold text-xs transition-colors self-start sm:self-auto">
            <Sliders className="h-3.5 w-3.5 text-[#763a12]" />
            <span>System Settings</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Two-Column Live Activity Feeds */}
      <div className="grid gap-5 lg:gap-6 lg:grid-cols-2">
        {/* Recent Orders Feed */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#211a14]">Recent Takeaway Orders</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-[#763a12]">
                  Live
                </span>
              </div>
              <p className="text-xs text-zinc-500">Latest orders submitted by customers</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#763a12] hover:text-[#5e2d0d] flex items-center gap-1 hover:underline"
            >
              <span>Manage all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">No orders yet.</div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((o) => {
                const orderRef = formatOrderRef(o.public_id);
                return (
                  <Link
                    key={o.public_id}
                    href={`/admin/orders?focus=${o.public_id}`}
                    title="Open this order in Orders"
                    className="group p-3.5 sm:p-4 rounded-xl border border-zinc-200/90 bg-white hover:bg-amber-50/20 hover:border-[#763a12]/35 transition-all shadow-2xs hover:shadow-xs flex flex-col gap-2.5"
                  >
                    {/* Top Row: Ref ID + Time + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {orderRef && (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-[#763a12] border border-amber-200/80 shadow-2xs">
                            #{orderRef}
                          </span>
                        )}
                        <span
                          className="text-[11px] font-semibold text-zinc-400 shrink-0"
                          suppressHydrationWarning
                        >
                          {mounted ? formatOrderTime(o.created_at) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={o.status} />
                        <ArrowRight className="h-3.5 w-3.5 text-[#763a12] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                      </div>
                    </div>

                    {/* Middle Row: Customer Name & Order Total */}
                    <div className="flex items-baseline justify-between gap-2 pt-0.5">
                      <span className="font-semibold text-xs sm:text-sm text-[#211a14] truncate">
                        {o.customer_name}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#763a12] tabular-nums shrink-0">
                        ${Number(o.total || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Bottom Row: Food Items List Pills */}
                    {o.items && o.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-600">
                        {o.items.map((i, idx) => (
                          <span
                            key={idx}
                            className="bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200/80 text-zinc-700 font-medium inline-flex items-center gap-1"
                          >
                            <span className="font-bold text-[#763a12]">{i.quantity}×</span>
                            <span className="truncate max-w-[200px]">{i.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Reservations Feed */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#211a14]">Upcoming Reservations</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-[#763a12]">
                  Tables
                </span>
              </div>
              <p className="text-xs text-zinc-500">Scheduled guest arrivals and parties</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-[#763a12] hover:text-[#5e2d0d] flex items-center gap-1 hover:underline"
            >
              <span>Manage all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : recentBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">No upcoming reservations found.</div>
          ) : (
            <div className="space-y-2.5">
              {recentBookings.map((b) => {
                const { offer } = parseBookingOffer(b.notes);
                const bookingRef = formatBookingRef(b.public_id);
                const diff = getDayDiff(b.date);
                const isTodayTomorrow = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : null;

                return (
                  <Link
                    key={b.public_id}
                    href={`/admin/bookings?focus=${b.public_id}`}
                    title="Open this reservation in Bookings"
                    className="group p-3.5 sm:p-4 rounded-xl border border-zinc-200/90 bg-white hover:bg-amber-50/20 hover:border-[#763a12]/35 transition-all shadow-2xs hover:shadow-xs flex flex-col gap-2.5"
                  >
                    {/* Top Row: Ref ID + Today/Tomorrow pill + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {bookingRef && (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-[#763a12] border border-amber-200/80 shadow-2xs">
                            #{bookingRef}
                          </span>
                        )}
                        {isTodayTomorrow && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 shrink-0">
                            {isTodayTomorrow}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={b.status} />
                        <ArrowRight className="h-3.5 w-3.5 text-[#763a12] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                      </div>
                    </div>

                    {/* Middle Row: Guest Name + Party Size + Offer Badge */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="font-semibold text-xs sm:text-sm text-[#211a14] truncate">
                        {b.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {b.party_size} {b.party_size === 1 ? "Guest" : "Guests"}
                        </span>
                        {offer && (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 inline-flex items-center gap-1"
                            title={`Offer: ${offer}`}
                          >
                            <span>🎁</span>
                            <span className="truncate max-w-[100px] sm:max-w-[140px]">{offer}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Date & Time + Preselected Dish */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 pt-1.5 border-t border-zinc-100">
                      <span className="font-bold text-[#211a14]">
                        {formatBookingDate(b.date)}
                      </span>
                      <span className="text-zinc-400 font-normal">at</span>
                      <span className="font-bold text-[#763a12] bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/60">
                        {formatTime12h(b.time)}
                      </span>
                      {b.preselected_dish && (
                        <span className="text-[11px] text-zinc-600 font-medium truncate max-w-full sm:max-w-[240px] flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                          <UtensilsCrossed className="h-3 w-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{b.preselected_dish}</span>
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Launchpad Navigation */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-[#763a12] uppercase tracking-wide mb-3 flex items-center gap-1.5">
          Quick links
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/menu"
            className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#211a14] group-hover:text-[#763a12] transition-colors">Menu</span>
              <UtensilsCrossed className="h-4 w-4 text-zinc-400 group-hover:text-[#763a12] transition-colors" />
            </div>
            <div className="text-[11px] text-zinc-500">Dishes &amp; pricing</div>
          </Link>

          <Link
            href="/admin/content"
            className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#211a14] group-hover:text-[#763a12] transition-colors">Site content</span>
              <MessageSquareHeart className="h-4 w-4 text-zinc-400 group-hover:text-[#763a12] transition-colors" />
            </div>
            <div className="text-[11px] text-zinc-500">Homepage, campaigns &amp; photos</div>
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#211a14] group-hover:text-[#763a12] transition-colors">Settings</span>
              <Sliders className="h-4 w-4 text-zinc-400 group-hover:text-[#763a12] transition-colors" />
            </div>
            <div className="text-[11px] text-zinc-500">Hours, contact &amp; theme</div>
          </Link>

          <Link
            href="/admin/reviews"
            className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#211a14] group-hover:text-[#763a12] transition-colors">Reviews</span>
              <Star className="h-4 w-4 text-zinc-400 group-hover:text-[#763a12] transition-colors" />
            </div>
            <div className="text-[11px] text-zinc-500">Approve customer reviews</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

