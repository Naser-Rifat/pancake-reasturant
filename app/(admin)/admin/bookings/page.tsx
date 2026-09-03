"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, X } from "lucide-react";
import {
  createAdminBooking,
  listBookingsPage,
  mergeRows,
  updateBooking,
  type AdminBooking,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { STATUS_BADGE } from "../status";
import { useToast } from "@/components/ui/toast";

const FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;
const POLL_MS = 20_000;

// same two-tone chime the Orders screen uses for new arrivals
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
  } catch { /* audio blocked until first user interaction — fine */ }
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_PHONE_BOOKING);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const knownIds = useRef<Set<string> | null>(null);
  const nextPage = useRef(2); // page 1 is the polled window; older pages load on demand

  const load = useCallback((isInitial = true) => {
    if (isInitial) setLoading(true);
    listBookingsPage(1, filter === "all" ? undefined : filter)
      .then((page) => {
        // new-request detection follows newly seen pending rows, not the filter view
        const fresh = knownIds.current
          ? page.results.filter((b) => b.status === "pending" && !knownIds.current!.has(b.public_id))
          : [];
        if (fresh.length > 0) {
          newBookingChime();
          toast({
            variant: "info",
            title: fresh.length === 1 ? "New booking request 📅" : `${fresh.length} new booking requests 📅`,
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
  }, [filter, toast]);

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
    // the filter changed (or first mount): restart from page 1 of that view
    setBookings([]);
    nextPage.current = 2;
    setHasMore(false);
    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const setStatus = async (b: AdminBooking, status: AdminBooking["status"]) => {
    const prev = bookings;
    setBookings((bs) => bs.map((x) => (x.public_id === b.public_id ? { ...x, status } : x)));
    try {
      await updateBooking(b.public_id, { status });
      toast({
        variant: "success",
        title:
          status === "confirmed"
            ? `${b.name}'s booking confirmed — email sent`
            : `${b.name}'s booking cancelled — guest notified`,
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
      // taken over the phone by staff, so it's confirmed on the spot
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
        title: "Phone booking saved as confirmed",
        description: form.email ? "Confirmation email sent to the guest" : undefined,
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

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">Confirm or cancel table requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)}>Refresh</Button>
          <Button size="sm" onClick={() => { setAdding(true); setError(""); }}>
            <Phone className="mr-1 h-4 w-4" /> Add phone booking
          </Button>
        </div>
      </div>

      {adding && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>New Phone Booking</CardTitle>
            <button
              onClick={() => setAdding(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPhoneBooking} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="pb-name">Guest name *</Label>
                <Input id="pb-name" required value={form.name} onChange={set("name")} placeholder="Jane Doe" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-phone">Phone number *</Label>
                <Input id="pb-phone" required type="tel" value={form.phone} onChange={set("phone")} placeholder="0412 345 678" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-email">Email (optional, sends confirmation)</Label>
                <Input id="pb-email" type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-date">Date *</Label>
                <Input id="pb-date" required type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-time">Time *</Label>
                <Input id="pb-time" required type="time" value={form.time} onChange={set("time")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-party">Party size *</Label>
                <Select id="pb-party" value={form.party_size} onChange={set("party_size")}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-notes">Notes</Label>
                <Input id="pb-notes" value={form.notes} onChange={set("notes")} placeholder="Birthday, window seat…" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" loading={saving}>
                  Save booking (confirmed)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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

      {error && <AdminError message={error} onRetry={load} />}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.public_id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{b.email}</div>
                      {b.phone && <div>{b.phone}</div>}
                    </TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.time.slice(0, 5)}</TableCell>
                    <TableCell>{b.party_size}</TableCell>
                    <TableCell className="max-w-48 text-muted-foreground">
                      {b.preselected_dish && (
                        <div className="mb-1 flex flex-wrap gap-1">
                          {/* the field holds several comma-separated favourites now */}
                          {b.preselected_dish.split(", ").map((d) => (
                            <span key={d} className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                              🥞 {d}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs">{b.notes || (!b.preselected_dish ? "—" : "")}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[b.status]}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {b.status !== "confirmed" && (
                          <Button size="sm" onClick={() => setStatus(b, "confirmed")}>Confirm</Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button size="sm" variant="destructive" onClick={() => setStatus(b, "cancelled")}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No bookings{filter !== "all" ? ` with status “${filter}”` : " yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {!loading && hasMore && (
            <div className="mt-4 flex justify-center border-t pt-4">
              <Button variant="outline" size="sm" loading={loadingMore} onClick={loadMore}>
                Load older bookings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
