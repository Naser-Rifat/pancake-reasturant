"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  DollarSign,
  CalendarCheck,
  Star,
  ArrowRight,
  ExternalLink,
  Plus,
  Phone,
  UtensilsCrossed,
  Clock,
  RefreshCw,
  Sliders,
  ChefHat,
  MessageSquareHeart,
  TrendingUp,
} from "lucide-react";
import {
  getStats,
  listBookings,
  listOrders,
  getSiteSettings,
  type AdminBooking,
  type AdminOrder,
  type AdminStats,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentBookings, setRecentBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const [s, o, b, siteRes] = await Promise.all([
        getStats(),
        listOrders(),
        listBookings(),
        getSiteSettings().catch(() => null),
      ]);
      setStats(s);
      setRecentOrders(o.slice(0, 5));
      // the card promises UPCOMING arrivals: nearest future dates first,
      // cancelled and past bookings left out (the API returns newest-request-first)
      const todayISO = new Date().toISOString().slice(0, 10);
      setRecentBookings(
        b
          .filter((x) => x.status !== "cancelled" && x.date >= todayISO)
          .sort((x, y) => `${x.date}T${x.time}`.localeCompare(`${y.date}T${y.time}`))
          .slice(0, 5),
      );
      if (siteRes) setSite(siteRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    // keep the "command center" live without skeleton flashes
    const id = setInterval(() => loadData(false), 60_000);
    return () => clearInterval(id);
  }, [loadData]);

  // Format 12-hour time
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
      {/* Top Operations Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {site?.online_ordering_enabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
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
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/admin/menu"
            className="inline-flex items-center bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-1.5 px-4 h-10 rounded-lg shadow-xs transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span>Add Dish</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center border border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 text-xs font-bold rounded-lg h-10 px-4 transition-all"
          >
            <Phone className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            <span>Bookings</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 h-10 rounded-lg border border-zinc-300 bg-white text-[#763a12] hover:bg-zinc-50 shadow-2xs transition-all"
          >
            <span>Live Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {error && <AdminError message={error} onRetry={loadData} />}

      {/* 4 Premium Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 [&>*]:min-w-0">
        {/* 1. Today's Revenue */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Revenue Today</span>
            <div className="text-2xl sm:text-3xl font-semibold text-[#763a12]">
              {loading ? <Skeleton className="h-8 w-24" /> : `$${stats?.revenue_today ?? "0.00"}`}
            </div>
            <span className="text-[10px] font-bold text-amber-700/80 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Live sales today
            </span>
          </div>
          
        </div>

        {/* 2. Orders Today */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Orders Today</span>
            <div className="text-2xl sm:text-3xl font-semibold text-[#211a14]">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.orders_today ?? 0} Orders`}
            </div>
            <span className="text-[10px] font-bold text-zinc-400">
              Takeaway &amp; counter
            </span>
          </div>
          
        </div>

        {/* 3. Pending Bookings */}
        <div
          className={`p-4 sm:p-5 rounded-xl border shadow-2xs flex items-center justify-between transition-all ${
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
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              )}
            </div>
            <span className="text-[10px] font-bold text-amber-700/80">
              Needs confirmation
            </span>
          </div>
          
        </div>

        {/* 4. Pending Reviews */}
        <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Reviews to Moderate</span>
            <div className="text-2xl sm:text-3xl font-semibold text-emerald-950">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats?.pending_reviews ?? 0}`}
            </div>
            <span className="text-[10px] font-bold text-emerald-700/80">
              Customer praise
            </span>
          </div>
          
        </div>
      </div>

      {stats?.total_orders != null && (
        <div className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-600 flex flex-wrap items-center justify-between gap-2">
          <span>
            All-time: <strong>{stats.total_orders.toLocaleString()}</strong> orders ·{" "}
            <strong>{stats.total_bookings.toLocaleString()}</strong> bookings
          </span>
          <Link href="/admin/settings" className="text-[#763a12] hover:underline flex items-center gap-1 font-semibold">
            <Sliders className="h-3 w-3" /> System Settings →
          </Link>
        </div>
      )}

      {/* Two-Column Live Activity Feeds */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders Feed */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-4">
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
            <div className="space-y-3">
              {recentOrders.map((o) => {
                const placedDate = new Date(o.created_at);
                const orderRef = o.public_id ? o.public_id.slice(0, 6).toUpperCase() : "";
                return (
                  <div
                    key={o.public_id}
                    className="p-3.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {orderRef && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700">
                            #{orderRef}
                          </span>
                        )}
                        <span className="font-semibold text-xs text-[#211a14]">{o.customer_name}</span>
                        <span className="text-[11px] font-semibold text-[#763a12]">${o.total}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[11px] text-zinc-500">
                        {o.items.map((i, idx) => (
                          <span key={idx} className="bg-white px-2 py-0.5 rounded-lg border border-zinc-200">
                            {i.quantity}× {i.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {placedDate.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
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
                        {o.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Reservations Feed */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-4">
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
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b.public_id}
                  className="p-3.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#211a14]">{b.name}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-50 text-[#763a12] border border-amber-200">
                        {b.party_size} {b.party_size === 1 ? "Guest" : "Guests"}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                      <span className="font-bold text-[#211a14]">
                        {new Date(`${b.date}T00:00:00`).toLocaleDateString("en-AU", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>at</span>
                      <span className="font-bold text-[#763a12] bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                        {formatTime12h(b.time)}
                      </span>
                      {b.preselected_dish && (
                        <span className="truncate max-w-[140px] text-zinc-600 font-medium">
                          · {b.preselected_dish}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        b.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                          : b.status === "pending"
                          ? "bg-amber-100 text-amber-950 border border-amber-300"
                          : "bg-rose-100 text-rose-950 border border-rose-300"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Launchpad Navigation */}
      <div className="pt-2">
        <h3 className="text-xs font-semibold text-[#763a12] uppercase tracking-wide mb-3 flex items-center gap-1.5">
          Quick links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin/menu"
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold text-[#211a14]">Menu</div>
            <div className="text-[11px] text-zinc-500">Dishes &amp; pricing</div>
          </Link>

          <Link
            href="/admin/content"
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold text-[#211a14]">Site content</div>
            <div className="text-[11px] text-zinc-500">Homepage, campaigns &amp; photos</div>
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold text-[#211a14]">Settings</div>
            <div className="text-[11px] text-zinc-500">Hours, contact &amp; theme</div>
          </Link>

          <Link
            href="/admin/reviews"
            className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-[#763a12] hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold text-[#211a14]">Reviews</div>
            <div className="text-[11px] text-zinc-500">Approve customer reviews</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
