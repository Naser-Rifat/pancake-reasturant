import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminSiteSettings } from "@/lib/admin-api";
import type { SetSiteField } from "../_lib";

// Home studio · Step 5: the bottom "Book a Table" invitation (CTA) copy.
export function HomeStep5Cta({
  site,
  setS,
  setHomeStepIndex,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  setHomeStepIndex: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-5">
      <h4 className="text-sm font-semibold text-[#211a14] pb-2 border-b border-zinc-200">Customize Bottom Invitation</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#211a14]">Headline Text</Label>
          <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.cta_heading} onChange={setS("cta_heading")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#211a14]">Handwriting Accent Word</Label>
          <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.cta_script} onChange={setS("cta_script")} />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs font-semibold text-[#211a14]">Short Invitation Description</Label>
          <Textarea rows={2} className="border-zinc-300 text-[#211a14] font-medium text-sm rounded-xl" value={site.cta_lead} onChange={setS("cta_lead")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#211a14]">Button Text</Label>
          <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.cta_button_label} onChange={setS("cta_button_label")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#211a14]">Button Link URL</Label>
          <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.cta_button_url} onChange={setS("cta_button_url")} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs font-bold border-zinc-300 text-[#763a12] rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(4)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous: Step 4 (Badges)</span>
        </Button>
        <Button
          type="button"
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(6)}
        >
          <span>Next: Step 6 (Footer)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
