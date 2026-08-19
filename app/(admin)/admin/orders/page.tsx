"use client";

import { useCallback, useEffect, useState } from "react";
import { listOrders, updateOrder, type AdminOrder } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUSES, STATUS_BADGE } from "../status";

const FILTERS = ["all", ...ORDER_STATUSES] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    listOrders(filter === "all" ? undefined : filter)
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [filter]);

  useEffect(load, [load]);

  const setStatus = async (o: AdminOrder, status: AdminOrder["status"]) => {
    const prev = orders;
    setOrders((os) => os.map((x) => (x.public_id === o.public_id ? { ...x, status } : x)));
    try {
      await updateOrder(o.public_id, { status });
    } catch (e) {
      setOrders(prev); // roll back optimistic update
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Advance orders as the kitchen works through them</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Set status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.public_id}>
                  <TableCell className="font-medium">{o.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{o.phone || o.email || "—"}</TableCell>
                  <TableCell className="max-w-64 text-muted-foreground">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </TableCell>
                  <TableCell className="font-medium">${o.total}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[o.status]}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={o.status}
                      onChange={(e) => setStatus(o, e.target.value as AdminOrder["status"])}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders{filter !== "all" ? ` with status “${filter}”` : " yet"}
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
