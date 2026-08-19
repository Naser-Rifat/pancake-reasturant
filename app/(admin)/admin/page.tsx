"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, DollarSign, ShoppingBag, Star } from "lucide-react";
import { getStats, listOrders, type AdminOrder, type AdminStats } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STATUS_BADGE } from "./status";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getStats(), listOrders()])
      .then(([s, o]) => {
        setStats(s);
        setRecent(o.slice(0, 6));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const cards = stats
    ? [
        { label: "Orders today", value: stats.orders_today, icon: ShoppingBag },
        { label: "Revenue today", value: `$${stats.revenue_today}`, icon: DollarSign },
        { label: "Pending bookings", value: stats.pending_bookings, icon: CalendarCheck },
        { label: "Reviews awaiting approval", value: stats.pending_reviews, icon: Star },
      ]
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">What&apos;s happening at KRUSH right now</p>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link href="/admin/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
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
              {recent.map((o) => (
                <TableRow key={o.public_id}>
                  <TableCell className="font-medium">{o.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </TableCell>
                  <TableCell>${o.total}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[o.status]}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                  </TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
