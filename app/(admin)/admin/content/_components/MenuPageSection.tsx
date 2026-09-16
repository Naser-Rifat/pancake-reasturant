import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveBar, SaveButton } from "@/components/admin/SaveButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import type { RunSave, SetSiteField } from "../_lib";

// Content studio panel for copy that belongs to the public /menu page.
export function MenuPageSection({
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
              Menu Header
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Menu Page Top Title</h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Main Word (e.g. Stacks On)</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.menu_hero_heading} onChange={setS("menu_hero_heading")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Handwriting Word (e.g. Stacks.)</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.menu_hero_script} onChange={setS("menu_hero_script")} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Subtitle</Label>
            <Input className="border-zinc-300 text-[#211a14] font-medium text-sm h-10 rounded-xl" value={site.menu_hero_lead} onChange={setS("menu_hero_lead")} />
          </div>
        </div>

        <SaveBar>
          <SaveButton loading={busy === "Menu hero"} onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  menu_hero_heading: site.menu_hero_heading,
                  menu_hero_script: site.menu_hero_script,
                  menu_hero_lead: site.menu_hero_lead,
                });
              }, "Menu hero")
            }>Save Header</SaveButton>
        </SaveBar>
      </div>

      <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div>
          <h4 className="text-xs font-semibold text-[#211a14]">Want to add or edit pancake dishes, flavours &amp; prices?</h4>
          <p className="text-[11px] font-medium text-zinc-500">Dishes are managed in the dedicated Menu Catalog section.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-[#763a12]/20 text-[#763a12] bg-white hover:bg-amber-50"
          >
            <Layers className="h-4 w-4" />
            <span>Manage Categories</span>
          </Link>
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg bg-[#763a12] text-white hover:bg-[#5e2d0d] shadow-sm"
          >
            <span>Go to Menu Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
