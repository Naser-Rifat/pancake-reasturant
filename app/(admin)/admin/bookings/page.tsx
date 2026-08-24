"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone, X } from "lucide-react";
import {
  createAdminBooking,
  listBookings,
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
import { STATUS_BADGE } from "../status";
import { useToast } from "@/components/ui/toast";

const FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;

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
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_PHONE_BOOKING);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    listBookings(filter === "all" ? undefined : filter)
      .then(setBookings)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [filter]);

  useEffect(load, [load]);

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
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">Confirm or cancel table requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" onClick={() => { setAdding(true); setError(""); }}>
            <Phone /> Add phone booking
          </Button>
        </div>
      </div>

      {adding && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Phone booking</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setAdding(false)} aria-label="Close form">
              <X />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPhoneBooking} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="pb-name">Guest name *</Label>
                <Input id="pb-name" required value={form.name} onChange={set("name")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-phone">Phone *</Label>
                <Input id="pb-phone" required inputMode="tel" value={form.phone} onChange={set("phone")} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="pb-email">Email (optional — gets the confirmation email)</Label>
                <Input id="pb-email" type="email" value={form.email} onChange={set("email")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-date">Date *</Label>
                <Input id="pb-date" type="date" required value={form.date} onChange={set("date")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-time">Time *</Label>
                <Input id="pb-time" type="time" required value={form.time} onChange={set("time")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-party">Party size</Label>
                <Select id="pb-party" className="h-9" value={form.party_size} onChange={set("party_size")}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
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

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Card>
        <CardContent className="pt-6">
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
                  <TableCell className="max-w-48 text-muted-foreground">{b.notes || "—"}</TableCell>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No bookings{filter !== "all" ? ` with status “${filter}”` : " yet"}
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
