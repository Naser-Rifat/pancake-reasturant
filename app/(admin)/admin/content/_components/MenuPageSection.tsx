import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateHomeStep,
  updateSiteSettings,
  type AdminHomeStep,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import type { RunSave, SetSiteField } from "../_lib";

// Content studio panel for the /menu page (header copy + 3-step pickup cards).
export function MenuPageSection({
  site,
  setS,
  steps,
  setSteps,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  steps: AdminHomeStep[];
  setSteps: Dispatch<SetStateAction<AdminHomeStep[]>>;
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
          <Button
            size="sm"
            className="font-bold text-xs bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
            loading={busy === "Menu hero"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  menu_hero_heading: site.menu_hero_heading,
                  menu_hero_script: site.menu_hero_script,
                  menu_hero_lead: site.menu_hero_lead,
                });
              }, "Menu hero")
            }
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Header
          </Button>
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
      </div>

      {/* 3-Step Pickup Cards */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
              Pickup Guide
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">3-Step Ordering Cards on /menu</h3>
          </div>
        </div>

        <div className="grid gap-3.5">
          {steps.map((st, i) => (
            <div
              key={st.id}
              className="p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#763a12] text-white">
                  STEP 0{i + 1}
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
                  loading={busy === `Step ${st.id}`}
                  onClick={() =>
                    run(
                      async () => {
                        await updateHomeStep(st.id, {
                          label: st.label,
                          title: st.title,
                          text: st.text,
                          image: st.image,
                        });
                      },
                      `Step 0${i + 1}`,
                      { title: `Step 0${i + 1} updated!` }
                    )
                  }
                >
                  <Save className="h-3 w-3 mr-1" /> Save Step 0{i + 1}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#211a14]">Title</Label>
                  <Input
                    className="h-10 text-xs border-zinc-300 text-[#211a14] font-bold rounded-xl"
                    value={st.title}
                    onChange={(e) =>
                      setSteps((xs) =>
                        xs.map((x) => (x.id === st.id ? { ...x, title: e.target.value } : x))
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#211a14]">Description</Label>
                  <Input
                    className="h-10 text-xs border-zinc-300 text-[#211a14] font-medium rounded-xl"
                    value={st.text}
                    onChange={(e) =>
                      setSteps((xs) =>
                        xs.map((x) => (x.id === st.id ? { ...x, text: e.target.value } : x))
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div>
          <h4 className="text-xs font-semibold text-[#211a14]">Want to add or edit pancake dishes, flavours &amp; prices?</h4>
          <p className="text-[11px] font-medium text-zinc-500">Dishes are managed in the dedicated Menu Catalog section.</p>
        </div>
        <Link
          href="/admin/menu"
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg bg-[#763a12] text-white hover:bg-[#5e2d0d] shadow-sm"
        >
          <span>Go to Menu Catalog</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
