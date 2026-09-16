"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SaveBar, SaveButton } from "@/components/admin/SaveButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import type { RunSave, SetSiteField } from "../_lib";

export function ClubPageSection({
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
    <div className="space-y-8">
      {/* 1. Club Hero Section */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
              Club Header
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Join Our Club Page Header</h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Small Top Kicker</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              value={site.club_hero_kicker ?? ""}
              onChange={setS("club_hero_kicker")}
              placeholder="The Pancake Club · Geelong West"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Main Word</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              value={site.club_hero_heading ?? ""}
              onChange={setS("club_hero_heading")}
              placeholder="Good food."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Handwriting Word</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic"
              value={site.club_hero_script ?? ""}
              onChange={setS("club_hero_script")}
              placeholder="Better company."
            />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Subtitle / Lead</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-medium text-sm h-10 rounded-xl"
              value={site.club_hero_lead ?? ""}
              onChange={setS("club_hero_lead")}
              placeholder="Fluffy homemade stacks, secret tasting invites, and a table always saved for you."
            />
          </div>
        </div>
      </div>

      {/* 2. 3 Bento Grid Photography Cards */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#efbf38] text-[#211a14] uppercase tracking-wide">
              Bento Grid
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Bento Visual Stories (3 Photo Slots)</h3>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Slot 1: Tall Hero Stack */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-[#faf8f5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#763a12]">Slot 1 · Tall Feature</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-zinc-600 font-semibold">Hero Stack</span>
            </div>
            {site.club_bento_1_img && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                <Image src={site.club_bento_1_img} alt="Slot 1 preview" fill className="object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Image URL</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_1_img ?? ""}
                onChange={setS("club_bento_1_img")}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Badge Text</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_1_badge ?? ""}
                onChange={setS("club_bento_1_badge")}
                placeholder="🥞 Fresh Off The Griddle"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Card Title (Script)</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white font-serif italic"
                value={site.club_bento_1_title ?? ""}
                onChange={setS("club_bento_1_title")}
                placeholder="Signature Stack"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Sub-caption</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_1_sub ?? ""}
                onChange={setS("club_bento_1_sub")}
                placeholder="Whipped butter & maple"
              />
            </div>
          </div>

          {/* Slot 2: Top-right Brunch */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-[#faf8f5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#763a12]">Slot 2 · Top Right</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-zinc-600 font-semibold">Brunch Spread</span>
            </div>
            {site.club_bento_2_img && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                <Image src={site.club_bento_2_img} alt="Slot 2 preview" fill className="object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Image URL</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_2_img ?? ""}
                onChange={setS("club_bento_2_img")}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Badge Text</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_2_badge ?? ""}
                onChange={setS("club_bento_2_badge")}
                placeholder="🥞 Sunday Brunch"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Card Title (Script)</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white font-serif italic"
                value={site.club_bento_2_title ?? ""}
                onChange={setS("club_bento_2_title")}
                placeholder="Brunch Club"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Sub-caption</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_2_sub ?? ""}
                onChange={setS("club_bento_2_sub")}
                placeholder="Weekend Table"
              />
            </div>
          </div>

          {/* Slot 3: Bottom-right Parlour */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-[#faf8f5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#763a12]">Slot 3 · Bottom Right</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-zinc-600 font-semibold">Parlour Space</span>
            </div>
            {site.club_bento_3_img && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                <Image src={site.club_bento_3_img} alt="Slot 3 preview" fill className="object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Image URL</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_3_img ?? ""}
                onChange={setS("club_bento_3_img")}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Badge Text</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_3_badge ?? ""}
                onChange={setS("club_bento_3_badge")}
                placeholder="☕ Geelong West"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Card Title (Script)</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white font-serif italic"
                value={site.club_bento_3_title ?? ""}
                onChange={setS("club_bento_3_title")}
                placeholder="Our Parlour"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Sub-caption</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_bento_3_sub ?? ""}
                onChange={setS("club_bento_3_sub")}
                placeholder="Open 7 days"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Founding Member Pass Strip */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
              VIP Pass
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Founding Member Pass Bar</h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Pass Number / Headline</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              value={site.club_pass_title ?? ""}
              onChange={setS("club_pass_title")}
              placeholder="FOUNDING MEMBER PASS · NO. 0824"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Privilege Subtitle</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-medium text-sm h-10 rounded-xl"
              value={site.club_pass_sub ?? ""}
              onChange={setS("club_pass_sub")}
              placeholder="Priority Seasonal Tastings · Secret Drops · Free Forever"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Right Badge</Label>
            <Input
              className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
              value={site.club_pass_badge ?? ""}
              onChange={setS("club_pass_badge")}
              placeholder="ALL WELCOME"
            />
          </div>
        </div>
      </div>

      {/* 4. 3 Member Privileges Cards */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#efbf38] text-[#211a14] uppercase tracking-wide">
              Privileges
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Member Privileges (3 Cards Below Form)</h3>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-[#faf8f5] space-y-3">
            <span className="text-xs font-bold text-[#763a12]">Privilege 1</span>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Badge</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_benefit_1_badge ?? ""}
                onChange={setS("club_benefit_1_badge")}
                placeholder="🥞 SEASONAL TASTES"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Title</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white font-bold"
                value={site.club_benefit_1_title ?? ""}
                onChange={setS("club_benefit_1_title")}
                placeholder="Seasonal First Tastes"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Description</Label>
              <Textarea
                className="border-zinc-300 text-xs bg-white min-h-[72px]"
                value={site.club_benefit_1_desc ?? ""}
                onChange={setS("club_benefit_1_desc")}
                placeholder="Be the first to preview autumn spiced ricotta hotcakes..."
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-[#faf8f5] space-y-3">
            <span className="text-xs font-bold text-[#763a12]">Privilege 2</span>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Badge</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_benefit_2_badge ?? ""}
                onChange={setS("club_benefit_2_badge")}
                placeholder="☕ PARLOUR PERKS"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Title</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white font-bold"
                value={site.club_benefit_2_title ?? ""}
                onChange={setS("club_benefit_2_title")}
                placeholder="Secret Parlour Drops"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Description</Label>
              <Textarea
                className="border-zinc-300 text-xs bg-white min-h-[72px]"
                value={site.club_benefit_2_desc ?? ""}
                onChange={setS("club_benefit_2_desc")}
                placeholder="Occasional unlisted griddle specials, birthday stack treats..."
              />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-[#faf8f5] space-y-3">
            <span className="text-xs font-bold text-[#763a12]">Privilege 3</span>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Badge</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white"
                value={site.club_benefit_3_badge ?? ""}
                onChange={setS("club_benefit_3_badge")}
                placeholder="💛 ZERO STRINGS"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Title</Label>
              <Input
                className="border-zinc-300 text-xs h-9 bg-white font-bold"
                value={site.club_benefit_3_title ?? ""}
                onChange={setS("club_benefit_3_title")}
                placeholder="Always Your Choice"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-zinc-700">Description</Label>
              <Textarea
                className="border-zinc-300 text-xs bg-white min-h-[72px]"
                value={site.club_benefit_3_desc ?? ""}
                onChange={setS("club_benefit_3_desc")}
                placeholder="No loyalty cards to scan, no passwords to memorize..."
              />
            </div>
          </div>
        </div>

        {/* Unified Save Bar */}
        <SaveBar>
          <SaveButton
            loading={busy === "Club content"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  club_hero_kicker: site.club_hero_kicker,
                  club_hero_heading: site.club_hero_heading,
                  club_hero_script: site.club_hero_script,
                  club_hero_lead: site.club_hero_lead,
                  club_bento_1_img: site.club_bento_1_img,
                  club_bento_1_badge: site.club_bento_1_badge,
                  club_bento_1_title: site.club_bento_1_title,
                  club_bento_1_sub: site.club_bento_1_sub,
                  club_bento_2_img: site.club_bento_2_img,
                  club_bento_2_badge: site.club_bento_2_badge,
                  club_bento_2_title: site.club_bento_2_title,
                  club_bento_2_sub: site.club_bento_2_sub,
                  club_bento_3_img: site.club_bento_3_img,
                  club_bento_3_badge: site.club_bento_3_badge,
                  club_bento_3_title: site.club_bento_3_title,
                  club_bento_3_sub: site.club_bento_3_sub,
                  club_pass_title: site.club_pass_title,
                  club_pass_sub: site.club_pass_sub,
                  club_pass_badge: site.club_pass_badge,
                  club_benefit_1_badge: site.club_benefit_1_badge,
                  club_benefit_1_title: site.club_benefit_1_title,
                  club_benefit_1_desc: site.club_benefit_1_desc,
                  club_benefit_2_badge: site.club_benefit_2_badge,
                  club_benefit_2_title: site.club_benefit_2_title,
                  club_benefit_2_desc: site.club_benefit_2_desc,
                  club_benefit_3_badge: site.club_benefit_3_badge,
                  club_benefit_3_title: site.club_benefit_3_title,
                  club_benefit_3_desc: site.club_benefit_3_desc,
                });
              }, "Club content", { title: "Club page updated", description: "All bento photos, pass details, and privilege cards saved." })
            }
          >
            Save Club Page Content
          </SaveButton>
        </SaveBar>
      </div>

      {/* Quick link to Member Registrations */}
      <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div>
          <h4 className="text-xs font-semibold text-[#211a14]">Looking for registered club members?</h4>
          <p className="text-[11px] font-medium text-zinc-500">
            View customer names, emails, consent status, or export club records.
          </p>
        </div>
        <Link
          href="/admin/club"
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg bg-[#763a12] text-white hover:bg-[#5e2d0d] shadow-sm"
        >
          <span>View Registrations Portal</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
