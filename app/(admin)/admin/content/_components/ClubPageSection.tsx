"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trash2 } from "lucide-react";
import { SaveBar, SaveButton } from "@/components/admin/SaveButton";
import { UploadButton } from "@/components/ui/upload-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import { validateImageForAspect, type AspectImageSpec } from "@/lib/image-validation";
import { useConfirm } from "@/components/ui/confirm";
import type { RunSave, SetSiteField } from "../_lib";

type BentoImageKey = "club_bento_1_img" | "club_bento_2_img" | "club_bento_3_img";

const BENTO_SPECS: Record<BentoImageKey, AspectImageSpec> = {
  club_bento_1_img: {
    label: "4:5 Portrait",
    targetRatio: 4 / 5,
    ratioTolerance: 0.06,
    minWidth: 800,
    minHeight: 1000,
    recommendedSize: "1200×1500px",
  },
  club_bento_2_img: {
    label: "4:3 Landscape",
    targetRatio: 4 / 3,
    ratioTolerance: 0.1,
    minWidth: 800,
    minHeight: 600,
    recommendedSize: "1600×1200px",
  },
  club_bento_3_img: {
    label: "4:3 Landscape",
    targetRatio: 4 / 3,
    ratioTolerance: 0.1,
    minWidth: 800,
    minHeight: 600,
    recommendedSize: "1600×1200px",
  },
};

function BentoPhotoEditor({
  slot,
  title,
  imageKey,
  badgeKey,
  titleKey,
  subKey,
  site,
  setS,
  setImage,
  run,
  className = "",
}: {
  slot: string;
  title: string;
  imageKey: BentoImageKey;
  badgeKey: "club_bento_1_badge" | "club_bento_2_badge" | "club_bento_3_badge";
  titleKey: "club_bento_1_title" | "club_bento_2_title" | "club_bento_3_title";
  subKey: "club_bento_1_sub" | "club_bento_2_sub" | "club_bento_3_sub";
  site: AdminSiteSettings;
  setS: SetSiteField;
  setImage: (key: BentoImageKey, value: string) => void;
  run: RunSave;
  className?: string;
}) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { confirm: confirmDialog } = useConfirm();
  const spec = BENTO_SPECS[imageKey];
  const imageUrl = localPreview || site[imageKey] || "";

  const handleUploaded = (url: string) => {
    setImage(imageKey, url);
    setLocalPreview(null);
    run(async () => {
      await updateSiteSettings({ ...site, [imageKey]: url });
    }, "Bento photo", { title: `Photo saved to ${slot}` });
  };

  const handleRemove = async () => {
    const ok = await confirmDialog({
      title: `Remove ${slot} photo?`,
      description: "This slot will show the empty state until a new photo is uploaded.",
      confirmLabel: "Remove photo",
      destructive: true,
    });
    if (!ok) return;
    setImage(imageKey, "");
    setLocalPreview(null);
    run(async () => {
      await updateSiteSettings({ ...site, [imageKey]: "" });
    }, "Bento photo", { title: `Photo removed from ${slot}` });
  };

  return (
    <div className={`club-studio-slot ${className}`}>
      <span
        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950 text-white shadow-xs"
        style={{ position: "absolute", top: "12px", left: "12px", zIndex: 6 }}
      >
        {slot}
      </span>

      {imageUrl ? (
        <>
          <button
            type="button"
            aria-label={`Remove ${slot} photo`}
            onClick={handleRemove}
            className="rounded-lg bg-black/80 text-white p-1.5 hover:bg-destructive transition-colors cursor-pointer"
            style={{ position: "absolute", top: "10px", right: "10px", zIndex: 6 }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="club-studio-img">
            <Image
              src={imageUrl}
              alt={`${slot} crop preview`}
              fill
              unoptimized={Boolean(localPreview)}
              className="object-cover"
            />
          </div>
        </>
      ) : (
        <div className="club-studio-img flex flex-col items-center justify-center gap-2.5 border-2 border-dashed border-[#d9c7b4] bg-[#faf5ee] p-5 text-center">
          <p className="text-xs font-bold text-[#763a12]">{title} · empty</p>
          <p className="max-w-64 text-[11px] leading-4 text-zinc-500">
            {spec.label} · recommended {spec.recommendedSize}<br />
            minimum {spec.minWidth}×{spec.minHeight}px · max 5 MB
          </p>
          <UploadButton
            label="Add Photo"
            dropzone
            validate={validateImageForAspect(spec)}
            onLocalPreview={setLocalPreview}
            onUploaded={handleUploaded}
          />
        </div>
      )}

      {/* Card Content Controls */}
      <div className="pt-2.5 space-y-2">
        {/* Row 1: Badge text + Replace/Upload button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Input
            aria-label={`${slot} badge`}
            className="h-8 text-xs border-zinc-200 font-medium rounded-lg min-w-0 flex-1 bg-white"
            value={site[badgeKey] ?? ""}
            onChange={setS(badgeKey)}
            placeholder="Badge (e.g. 🥞 Fresh Off The Griddle)"
          />
          <UploadButton
            label={imageUrl ? "Replace" : "Upload"}
            validate={validateImageForAspect(spec)}
            onLocalPreview={setLocalPreview}
            onUploaded={handleUploaded}
          />
        </div>

        {/* Row 2: Title (Script) & Sub-caption */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            aria-label={`${slot} title`}
            className="h-8 text-xs border-zinc-200 font-serif italic rounded-lg min-w-0 bg-white"
            value={site[titleKey] ?? ""}
            onChange={setS(titleKey)}
            placeholder="Title (e.g. Signature Stack)"
          />
          <Input
            aria-label={`${slot} caption`}
            className="h-8 text-xs border-zinc-200 rounded-lg min-w-0 bg-white"
            value={site[subKey] ?? ""}
            onChange={setS(subKey)}
            placeholder="Sub-caption (e.g. Warm from the griddle)"
          />
        </div>

        {/* Row 3: Aspect label & Paste URL toggle */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 px-0.5">
          <span>{spec.label} · Recommended {spec.recommendedSize}</span>
          <details className="inline-block">
            <summary className="cursor-pointer font-semibold text-zinc-500 hover:text-zinc-800">
              Paste URL
            </summary>
            <div className="mt-1">
              <Input
                className="h-7 text-[11px] bg-white border-zinc-200"
                value={site[imageKey] ?? ""}
                onChange={setS(imageKey)}
                placeholder="https://…"
              />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export function ClubPageSection({
  site,
  setSite,
  setS,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setSite: React.Dispatch<React.SetStateAction<AdminSiteSettings | null>>;
  setS: SetSiteField;
  busy: string;
  run: RunSave;
}) {
  const setImage = (key: BentoImageKey, value: string) =>
    setSite((current) => (current ? { ...current, [key]: value } : current));

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

        <p className="-mt-2 text-xs font-medium text-zinc-600">
          This manager is the exact public bento layout—Slot #1 is the tall hero. Drop a correctly sized photo into an empty slot, or use Replace on a filled one.
        </p>
        <style>{`
          .club-studio-bento {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .club-studio-slot {
            display: flex;
            min-width: 0;
            flex-direction: column;
            position: relative;
            padding: 10px 10px 12px;
            border-radius: 16px;
            border: 1.5px solid rgba(118, 58, 18, 0.12);
            background: #fff;
            box-shadow: 0 8px 22px rgba(33, 26, 20, 0.08);
          }
          .club-studio-img {
            position: relative;
            min-height: 180px;
            flex: 1;
            overflow: hidden;
            border-radius: 12px;
            background: #f4ebe1;
          }
          /* Mobile (< 640px) */
          @media (max-width: 639px) {
            .club-studio-img {
              min-height: 160px;
            }
            .club-studio-hero .club-studio-img {
              min-height: 230px;
            }
          }
          /* Tablet (640px to 1023px) */
          @media (min-width: 640px) and (max-width: 1023px) {
            .club-studio-bento {
              grid-template-columns: 1.1fr 1fr;
              grid-template-rows: auto auto;
              gap: 14px;
              align-items: stretch;
            }
            .club-studio-hero {
              grid-row: span 2;
            }
            .club-studio-img {
              min-height: 155px;
            }
            .club-studio-hero .club-studio-img {
              min-height: 360px;
            }
          }
          /* Desktop (>= 1024px) */
          @media (min-width: 1024px) {
            .club-studio-bento {
              grid-template-columns: 1.15fr 1fr;
              grid-template-rows: minmax(310px, auto) minmax(310px, auto);
              gap: 18px;
              align-items: stretch;
            }
            .club-studio-hero {
              grid-row: span 2;
            }
            .club-studio-img {
              min-height: 180px;
            }
            .club-studio-hero .club-studio-img {
              min-height: 420px;
            }
          }
        `}</style>
        <div className="club-studio-bento">
          <BentoPhotoEditor
            className="club-studio-hero"
            slot="#1 · Tall Hero"
            title="Main pancake story"
            imageKey="club_bento_1_img"
            badgeKey="club_bento_1_badge"
            titleKey="club_bento_1_title"
            subKey="club_bento_1_sub"
            site={site}
            setS={setS}
            setImage={setImage}
            run={run}
          />
          <BentoPhotoEditor
            slot="#2 · Top Right"
            title="Brunch spread"
            imageKey="club_bento_2_img"
            badgeKey="club_bento_2_badge"
            titleKey="club_bento_2_title"
            subKey="club_bento_2_sub"
            site={site}
            setS={setS}
            setImage={setImage}
            run={run}
          />
          <BentoPhotoEditor
            slot="#3 · Bottom Right"
            title="Venue or atmosphere"
            imageKey="club_bento_3_img"
            badgeKey="club_bento_3_badge"
            titleKey="club_bento_3_title"
            subKey="club_bento_3_sub"
            site={site}
            setS={setS}
            setImage={setImage}
            run={run}
          />
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
