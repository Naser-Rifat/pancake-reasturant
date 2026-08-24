"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listOrders, updateOrder, type AdminOrder } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUSES, STATUS_BADGE } from "../status";
import { useToast } from "@/components/ui/toast";

const FILTERS = ["all", ...ORDER_STATUSES] as const;
const POLL_MS = 15_000;

/** Two short rising beeps — no audio asset needed. */
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
    // release the context — browsers cap live AudioContexts per page
    setTimeout(() => ctx.close(), 600);
  } catch { /* audio blocked until first user interaction — fine */ }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [error, setError] = useState("");
  const knownIds = useRef<Set<string> | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      // always fetch ALL orders so new ones are detected regardless of filter
      const all = await listOrders();
      if (knownIds.current !== null) {
        const fresh = all.filter((o) => !knownIds.current!.has(o.public_id));
        if (fresh.length > 0) {
          newOrderChime();
          toast({
            variant: "info",
            title: fresh.length === 1 ? "New order received 🎉" : `${fresh.length} new orders received 🎉`,
            description: fresh.map((o) => o.customer_name).join(", "),
          });
        }
      }
      knownIds.current = new Set(all.map((o) => o.public_id));
      setOrders(all);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [toast]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const setStatus = async (o: AdminOrder, status: AdminOrder["status"]) => {
    let cancel_reason = o.cancel_reason;
    if (status === "cancelled") {
      const input = window.prompt(
        "Reason for cancelling (this is emailed to the customer):",
        cancel_reason || ""
      );
      if (input === null) return; // staff backed out — keep current status
      cancel_reason = input.trim();
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
            ? "Order cancelled — customer emailed the reason"
            : status === "ready"
              ? "Order marked ready — customer notified"
              : `Order moved to “${status}”`,
      });
    } catch (e) {
      setOrders(prev); // roll back optimistic update
      toast({
        variant: "error",
        title: "Status update failed",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            New orders appear automatically with a chime — checked every 15 seconds
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Refresh now</Button>
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
              {visible.map((o) => (
                <TableRow key={o.public_id}>
                  <TableCell className="font-medium">{o.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{o.phone || o.email || "—"}</TableCell>
                  <TableCell className="max-w-64 text-muted-foreground">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    {o.status === "cancelled" && o.cancel_reason && (
                      <div className="text-xs text-destructive">Reason: {o.cancel_reason}</div>
                    )}
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
              {visible.length === 0 && (
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
