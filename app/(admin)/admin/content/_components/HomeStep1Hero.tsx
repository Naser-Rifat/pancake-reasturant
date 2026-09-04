import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "@/components/ui/image-field";
import { updateMenuItem, type AdminMenuItem, type AdminSiteSettings } from "@/lib/admin-api";
import type { RunSave, SetSiteField } from "../_lib";

// Home studio · Step 1: hero headline/images + the 3-slot hero carousel controller.
export function HomeStep1Hero({
  site,
  setS,
  setSite,
  menuItems,
  setMenuItems,
  run,
  setHomeStepIndex,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  setSite: Dispatch<SetStateAction<AdminSiteSettings | null>>;
  menuItems: AdminMenuItem[];
  setMenuItems: Dispatch<SetStateAction<AdminMenuItem[]>>;
  run: RunSave;
  setHomeStepIndex: Dispatch<SetStateAction<number>>;
}) {
  const featuredDishes = menuItems.filter((m) => m.is_featured);
  const featuredPrices = featuredDishes.map((m) => parseFloat(m.price)).filter((n) => !isNaN(n));
  const featuredPrice = featuredPrices.length ? Math.min(...featuredPrices) : 14;
  const slot2Dish = featuredDishes[0] ?? null;
  const slot3Dish = featuredDishes[1] ?? null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
        <Palette className="h-5 w-5 text-[#aa4c0a]" />
        <h3 className="text-base font-semibold text-[#211a14]">Edit Hero Text &amp; Images</h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#211a14]">1. Main Headline (Bold First Part)</Label>
          <Input
            className="border-zinc-300 bg-white text-[#211a14] font-bold text-sm h-11 rounded-xl"
            placeholder="e.g. Stack Into"
            value={site.hero_heading}
            onChange={setS("hero_heading")}
          />
          <p className="text-[11px] font-medium text-zinc-500">The chunky retro title</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#211a14]">2. Fancy Handwriting Word (Second Part)</Label>
          <Input
            className="border-zinc-300 bg-white text-[#211a14] font-bold text-sm h-11 rounded-xl font-serif italic"
            placeholder="e.g. Happiness"
            value={site.hero_script}
            onChange={setS("hero_script")}
          />
          <p className="text-[11px] font-medium text-zinc-500">Rendered in cursive script</p>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-semibold text-[#211a14]">3. Welcome Subtitle Tagline</Label>
          <Textarea
            rows={2}
            className="border-zinc-300 bg-white text-[#211a14] font-medium text-sm rounded-xl"
            placeholder="e.g. We flip the best homemade pancakes in Sydney..."
            value={site.hero_lead}
            onChange={setS("hero_lead")}
          />
        </div>

        <div className="sm:col-span-2 grid gap-5 md:grid-cols-2 p-5 rounded-lg border border-zinc-200 bg-white">
          <ImageField
            id="hero-image"
            label="Background Pancake Stack Photo (Slide 1 in Carousel)"
            hint="Square 1:1 · 1400×1400px"
            ratio="1 / 1"
            value={site.hero_image}
            onChange={setS("hero_image")}
            onUploaded={(url) => setSite((s) => (s ? { ...s, hero_image: url } : s))}
          />
          <ImageField
            id="hero-cutout"
            label="Round Dish Cutout Badge (Inside Headline)"
            hint="Transparent PNG · 600px+"
            ratio="1 / 1"
            fit="contain"
            cutout
            value={site.hero_cutout}
            onChange={setS("hero_cutout")}
            onUploaded={(url) => setSite((s) => (s ? { ...s, hero_cutout: url } : s))}
          />
        </div>

        {/* 🌟 3-SLOT HERO CAROUSEL CONTROLLER */}
        <div className="sm:col-span-2 p-5 sm:p-6 rounded-xl border border-zinc-200 bg-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div>
              <h4 className="text-sm font-semibold text-[#211a14] uppercase tracking-wide flex items-center gap-2">
                Hero carousel slides &amp; price tag
              </h4>
              <p className="text-xs font-medium text-zinc-600 mt-0.5">
                The three slides shown in the website's hero switcher. Changes save instantly.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-[#763a12] text-amber-300 text-xs font-semibold self-start sm:self-auto shadow-xs">
              Live Price Tag: From ${featuredPrice}
            </div>
          </div>

          {/* 3 Dedicated Slots */}
          <div className="grid gap-4 sm:grid-cols-3 [&>*]:min-w-0">
            {/* SLOT 1 */}
            <div className="p-4 rounded-lg border border-zinc-300 bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#763a12] text-white">
                  Slide 1 (Main)
                </span>
                <span className="text-xs font-semibold text-amber-800">From ${featuredPrice}</span>
              </div>
              <div className="relative h-28 rounded-xl overflow-hidden bg-zinc-100 border">
                {site.hero_image ? (
                  <Image src={site.hero_image} alt="Hero Stack" fill sizes="400px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🥞</div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#211a14]">Signature Hero Stack</p>
                <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Background Photo Above
                </p>
              </div>
            </div>

            {/* SLOT 2 */}
            <div className="p-4 rounded-lg border border-[#763a12] bg-white shadow-xs ring-2 ring-[#763a12]/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#763a12] text-amber-300">
                  Slide 2 (Carousel)
                </span>
                <span className="text-xs font-semibold text-[#aa4c0a]">
                  {slot2Dish ? `$${parseFloat(slot2Dish.price)}` : "Select dish"}
                </span>
              </div>
              <div className="relative h-28 rounded-xl overflow-hidden bg-zinc-100 border">
                {slot2Dish?.photo || slot2Dish?.image ? (
                  <Image src={slot2Dish.photo || slot2Dish?.image} alt={slot2Dish.name} fill sizes="400px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-300">🥞</div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold truncate text-[#211a14]">
                  {slot2Dish ? slot2Dish.name : "No dish chosen"}
                </p>
                <Select
                  className="h-9 text-xs border-zinc-300 font-bold rounded-xl"
                  value={slot2Dish?.slug ?? ""}
                  onChange={(e) => {
                    const newSlug = e.target.value;
                    if (!newSlug) return;
                    run(async () => {
                      if (slot2Dish) await updateMenuItem(slot2Dish.slug, { is_featured: false });
                      await updateMenuItem(newSlug, { is_featured: true });
                      setMenuItems((xs) =>
                        xs.map((x) => {
                          if (x.slug === newSlug) return { ...x, is_featured: true };
                          if (slot2Dish && x.slug === slot2Dish.slug) return { ...x, is_featured: false };
                          return x;
                        })
                      );
                    }, "Hero Slide 2", { title: "Slide 2 updated" });
                  }}
                >
                  <option value="">-- Choose Dish for Slide 2 --</option>
                  {menuItems.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} (${parseFloat(m.price)})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* SLOT 3 */}
            <div className="p-4 rounded-lg border border-[#763a12] bg-white shadow-xs ring-2 ring-[#763a12]/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#763a12] text-amber-300">
                  Slide 3 (Carousel)
                </span>
                <span className="text-xs font-semibold text-[#aa4c0a]">
                  {slot3Dish ? `$${parseFloat(slot3Dish.price)}` : "Select dish"}
                </span>
              </div>
              <div className="relative h-28 rounded-xl overflow-hidden bg-zinc-100 border">
                {slot3Dish?.photo || slot3Dish?.image ? (
                  <Image src={slot3Dish.photo || slot3Dish?.image} alt={slot3Dish.name} fill sizes="400px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-300">🥞</div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold truncate text-[#211a14]">
                  {slot3Dish ? slot3Dish.name : "No dish chosen"}
                </p>
                <Select
                  className="h-9 text-xs border-zinc-300 font-bold rounded-xl"
                  value={slot3Dish?.slug ?? ""}
                  onChange={(e) => {
                    const newSlug = e.target.value;
                    if (!newSlug) return;
                    run(async () => {
                      if (slot3Dish) await updateMenuItem(slot3Dish.slug, { is_featured: false });
                      await updateMenuItem(newSlug, { is_featured: true });
                      setMenuItems((xs) =>
                        xs.map((x) => {
                          if (x.slug === newSlug) return { ...x, is_featured: true };
                          if (slot3Dish && x.slug === slot3Dish.slug) return { ...x, is_featured: false };
                          return x;
                        })
                      );
                    }, "Hero Slide 3", { title: "Slide 3 updated" });
                  }}
                >
                  <option value="">-- Choose Dish for Slide 3 --</option>
                  {menuItems.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} (${parseFloat(m.price)})
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* All Menu Dishes Quick Selector */}
          <div className="pt-3 border-t border-amber-200">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide block mb-2.5">
              All Menu Dishes ({menuItems.length} items available in Catalog):
            </span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
              {menuItems.map((m) => {
                const isFeatured = m.is_featured;
                return (
                  <div
                    key={m.slug}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      isFeatured
                        ? "bg-white border-[#763a12] shadow-xs"
                        : "bg-white/60 border-zinc-200 hover:bg-white"
                    }`}
                  >
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border">
                      {m.photo || m.image ? (
                        <Image src={m.photo || m.image} alt={m.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">🥞</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-[#211a14]">{m.name}</p>
                      <p className="text-[11px] font-bold text-[#aa4c0a]">${parseFloat(m.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        run(async () => {
                          await updateMenuItem(m.slug, { is_featured: !isFeatured });
                          setMenuItems((xs) =>
                            xs.map((x) => (x.slug === m.slug ? { ...x, is_featured: !isFeatured } : x))
                          );
                        }, "Dish carousel status", {
                          title: isFeatured
                            ? `${m.name} removed from the hero carousel`
                            : `${m.name} added to the hero carousel`,
                        })
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                        isFeatured
                          ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          : "bg-[#763a12] text-white hover:bg-[#5e2d0d]"
                      }`}
                    >
                      {isFeatured ? "Remove" : "+ Carousel"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <span className="text-xs font-bold text-zinc-500">Section 1 Complete</span>
        <Button
          type="button"
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(2)}
        >
          <span>Next: Step 2 (Special Deals &amp; Campaigns)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
