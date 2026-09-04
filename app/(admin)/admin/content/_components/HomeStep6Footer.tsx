import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import type { PageTab, RunSave, SetSiteField } from "../_lib";

// Home studio · Step 6: the footer brand tagline.
export function HomeStep6Footer({
  site,
  setS,
  busy,
  run,
  setHomeStepIndex,
  setActivePage,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  busy: string;
  run: RunSave;
  setHomeStepIndex: Dispatch<SetStateAction<number>>;
  setActivePage: Dispatch<SetStateAction<PageTab>>;
}) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
            Section 6
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#211a14]">Footer Brand Tagline</h3>
            <p className="text-xs text-zinc-500">The founding line shown under the footer logo on every page</p>
          </div>
        </div>
        <Button
          size="sm"
          className="font-bold text-xs bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
          loading={busy === "Footer tagline"}
          onClick={() =>
            run(async () => {
              await updateSiteSettings({ footer_tagline: site.footer_tagline });
            }, "Footer tagline")
          }
        >
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Footer
        </Button>
      </div>

      <div className="space-y-2 max-w-lg">
        <Label className="text-xs font-semibold text-[#211a14]">Footer Tagline</Label>
        <Input
          className="border-zinc-300 text-[#211a14] font-bold text-sm h-11 rounded-xl"
          value={site.footer_tagline}
          onChange={setS("footer_tagline")}
          placeholder="e.g. Fluffy stacks · real maple · est. 1999"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs font-bold border-zinc-300 text-[#763a12] rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(5)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous: Step 5 (Bottom Banner)</span>
        </Button>
        <Button
          type="button"
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
          onClick={() => setActivePage("menu")}
        >
          <span>Next: Menu page</span>
        </Button>
      </div>
    </div>
  );
}
