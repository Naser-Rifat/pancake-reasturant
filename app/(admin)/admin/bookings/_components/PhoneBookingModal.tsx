import type { ChangeEvent, FormEvent } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PhoneBooking } from "../_lib";

// Staff form for recording a phone booking (saved as confirmed).
export function PhoneBookingModal({
  form,
  set,
  onSubmit,
  saving,
  onClose,
}: {
  form: PhoneBooking;
  set: (key: keyof PhoneBooking) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent) => void;
  saving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#763a12] shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#763a12] text-white uppercase tracking-wide">
            PHONE BOOKING
          </div>
          <h3 className="text-lg font-semibold text-[#211a14]">New phone booking</h3>
          <p className="text-xs text-zinc-500">
            Recorded by staff and saved as <strong>confirmed</strong>.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close form"
          className="rounded-xl hover:bg-zinc-100"
        >
          <X className="h-5 w-5 text-zinc-500" />
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="pb-name" className="text-xs font-semibold text-[#211a14]">
              Guest Full Name *
            </Label>
            <Input
              id="pb-name"
              required
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              placeholder="e.g. Sarah Jenkins"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pb-phone" className="text-xs font-semibold text-[#211a14]">
              Contact Phone Number *
            </Label>
            <Input
              id="pb-phone"
              required
              type="tel"
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              placeholder="04xx xxx xxx"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="pb-email" className="text-xs font-semibold text-[#211a14]">
              Email Address (Optional — sends confirmation email)
            </Label>
            <Input
              id="pb-email"
              type="email"
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              placeholder="sarah@example.com"
              value={form.email}
              onChange={set("email")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pb-party" className="text-xs font-semibold text-[#211a14]">
              Party Size (Guests) *
            </Label>
            <Select
              id="pb-party"
              className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
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
            <Label htmlFor="pb-date" className="text-xs font-semibold text-[#211a14]">
              Reservation Date *
            </Label>
            <Input
              id="pb-date"
              required
              type="date"
              min={new Date().toISOString().split("T")[0]}
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              value={form.date}
              onChange={set("date")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pb-time" className="text-xs font-semibold text-[#211a14]">
              Arrival Time *
            </Label>
            <Input
              id="pb-time"
              required
              type="time"
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              value={form.time}
              onChange={set("time")}
            />
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="pb-notes" className="text-xs font-semibold text-[#211a14]">
              Table Request &amp; Dietary Notes
            </Label>
            <Input
              id="pb-notes"
              className="border-zinc-300 text-[#211a14] font-medium text-xs h-10 rounded-xl"
              placeholder="e.g. Birthday celebration, window booth requested, highchair needed"
              value={form.notes}
              onChange={set("notes")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200">
          <Button
            type="button"
            variant="ghost"
            className="text-xs font-bold text-zinc-600 rounded-xl"
            onClick={onClose}
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
  );
}
