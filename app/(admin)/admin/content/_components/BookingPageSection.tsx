import Link from "next/link";
import { ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import type { RunSave, SetSiteField } from "../_lib";

// Content studio panel for the /booking page (header copy + link to bookings portal).
export function BookingPageSection({
  site,
  setS,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  busy: string;
  run: RunSave;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
              Booking Header
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Reservation Page Header</h3>
          </div>
          <Button
            size="sm"
            className="font-bold text-xs bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
            loading={busy === "Booking hero"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  booking_hero_kicker: site.booking_hero_kicker,
                  booking_hero_heading: site.booking_hero_heading,
                  booking_hero_script: site.booking_hero_script,
                  booking_hero_lead: site.booking_hero_lead,
                });
              }, "Booking hero")
            }
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Header
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Small Top Kicker</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.booking_hero_kicker} onChange={setS("booking_hero_kicker")} placeholder="Reserve Online" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Main Word</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.booking_hero_heading} onChange={setS("booking_hero_heading")} placeholder="Book a" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Handwriting Word</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.booking_hero_script} onChange={setS("booking_hero_script")} placeholder="Table." />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Subtitle</Label>
            <Input className="border-zinc-300 text-[#211a14] font-medium text-sm h-10 rounded-xl" value={site.booking_hero_lead} onChange={setS("booking_hero_lead")} placeholder="Pick a date, pick a time..." />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div>
          <h4 className="text-xs font-semibold text-[#211a14]">Want to view incoming customer table reservations?</h4>
          <p className="text-[11px] font-medium text-zinc-500">Check reservation dates, party sizes, and customer requests.</p>
        </div>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg bg-[#763a12] text-white hover:bg-[#5e2d0d] shadow-sm"
        >
          <span>View Bookings Portal</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
