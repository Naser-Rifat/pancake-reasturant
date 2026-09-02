"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, DollarSign, ShoppingBag, Star } from "lucide-react";
import {
  getStats,
  listBookings,
  listOrders,
  type AdminBooking,
  type AdminOrder,
  type AdminStats,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { STATUS_BADGE } from "./status";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentBookings, setRecentBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, o, b] = await Promise.all([getStats(), listOrders(), listBookings()]);
      setStats(s);
      setRecentOrders(o.slice(0, 6));
      setRecentBookings(b.slice(0, 6));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cards = stats
    ? [
        { label: "Orders today", value: stats.orders_today, icon: ShoppingBag },
        { label: "Revenue today", value: `$${stats.revenue_today}`, icon: DollarSign },
        { label: "Pending bookings", value: stats.pending_bookings, icon: CalendarCheck },
        { label: "Reviews awaiting approval", value: stats.pending_reviews, icon: Star },
      ]
    : [
        { label: "Orders today", value: 0, icon: ShoppingBag },
        { label: "Revenue today", value: "$0.00", icon: DollarSign },
        { label: "Pending bookings", value: 0, icon: CalendarCheck },
        { label: "Reviews awaiting approval", value: 0, icon: Star },
      ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">What&apos;s happening at The Pancake Club right now</p>
      </div>

      {error && <AdminError message={error} onRetry={loadData} />}

      {/* 4 Stat Cards / Skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : cards.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Latest takeaway requests</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.public_id}>
                      <TableCell className="font-medium">{o.customer_name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </TableCell>
                      <TableCell className="font-medium">${o.total}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[o.status]}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(o.created_at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Reservations</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Upcoming table bookings</p>
            </div>
            <Link href="/admin/bookings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Pre-order / Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((b) => (
                    <TableRow key={b.public_id}>
                      <TableCell className="font-medium">
                        <div>{b.name}</div>
                        {b.phone && <div className="text-xs text-muted-foreground">{b.phone}</div>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.date} at {b.time.slice(0, 5)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{b.party_size}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                        {b.preselected_dish || b.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[b.status]}>{b.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No bookings yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
