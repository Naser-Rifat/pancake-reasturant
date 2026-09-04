import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Gift, Plus, Save, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "@/components/ui/image-field";
import { useConfirm } from "@/components/ui/confirm";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  type AdminAnnouncement,
  type AdminMenuItem,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import {
  isoToLocalInput,
  localInputToIso,
  type CampaignFormat,
  type RunSave,
  type SetActiveDeal,
  type SetSiteField,
} from "../_lib";

// Home studio · Step 2: the two campaign stations (top deal band + offers slider).
export function HomeStep2Campaigns({
  site,
  setS,
  campaignChannel,
  setCampaignChannel,
  selectedDealId,
  setSelectedDealId,
  setAnnouncements,
  stationDeals,
  stationPlacement,
  activeDeal,
  setActiveDeal,
  legacyBackend,
  topBannerId,
  bandUsingFallback,
  menuItems,
  run,
  busy,
  setHomeStepIndex,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  campaignChannel: "channel1" | "channel2";
  setCampaignChannel: Dispatch<SetStateAction<"channel1" | "channel2">>;
  selectedDealId: number | null;
  setSelectedDealId: Dispatch<SetStateAction<number | null>>;
  setAnnouncements: Dispatch<SetStateAction<AdminAnnouncement[]>>;
  stationDeals: AdminAnnouncement[];
  stationPlacement: CampaignFormat;
  activeDeal: AdminAnnouncement | null;
  setActiveDeal: SetActiveDeal;
  legacyBackend: boolean;
  topBannerId: number | null;
  bandUsingFallback: boolean;
  menuItems: AdminMenuItem[];
  run: RunSave;
  busy: string;
  setHomeStepIndex: Dispatch<SetStateAction<number>>;
}) {
  const { confirm: confirmDialog } = useConfirm();

  return (
    <div className="space-y-6">
      {legacyBackend && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 leading-relaxed">
          The live server is still running the old backend, so the Band/Slider split and the Section
          Titles below can&apos;t save yet. For now every deal sits in the <strong>Offers Slider</strong>{" "}
          station — edit them there. Everything here starts working after the next backend deploy
          (migrations 0020–0023).
        </div>
      )}

      {/* Which station am I editing? */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-3">
        <p className="text-xs font-bold text-[#211a14] leading-relaxed">
          <strong>Two separate campaign spots:</strong> the <strong>Top Deal Band</strong> sits under
          the hero and changes often — the <strong>Offers Slider</strong> comes after the menu and runs
          long-term offers. Each has its own deals; they never mix.
        </p>
        <div className="grid gap-2 sm:flex sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setCampaignChannel("channel1");
              setSelectedDealId(null);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              campaignChannel === "channel1"
                ? "bg-[#763a12] text-white shadow-xs"
                : "bg-white hover:bg-zinc-100 text-[#211a14] border border-zinc-200"
            }`}
          >
            <Gift className="h-4 w-4" />
            <span>1. Top Deal Band — changes often</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCampaignChannel("channel2");
              setSelectedDealId(null);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              campaignChannel === "channel2"
                ? "bg-[#763a12] text-white shadow-xs"
                : "bg-white hover:bg-zinc-100 text-[#211a14] border border-zinc-200"
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>2. Offers Slider — long-running</span>
          </button>
        </div>
      </div>

      {/* Section headings for the selected station */}
      <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
          <h4 className="text-sm font-semibold text-[#211a14]">
            {campaignChannel === "channel1" ? "Top Band Section Title" : "Offers Slider Section Titles"}
          </h4>
          <span className="text-[11px] font-bold text-zinc-500">Saved by “Save Section Changes” up top</span>
        </div>
        {campaignChannel === "channel1" ? (
          <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#211a14]">Band Kicker</Label>
              <Input
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                value={site.promo_kicker ?? ""}
                onChange={setS("promo_kicker")}
                placeholder="✨ TODAY'S FEATURED SPECIAL"
              />
              <p className="text-[10px] text-zinc-500">Gold text above the band headline</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#211a14]">Slider Eyebrow</Label>
              <Input
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                value={site.offers_kicker ?? ""}
                onChange={setS("offers_kicker")}
                placeholder="On Right Now"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#211a14]">Slider Title</Label>
              <Input
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                value={site.offers_title ?? ""}
                onChange={setS("offers_title")}
                placeholder="This Week's Offers"
              />
              <p className="text-[10px] text-zinc-500">The last word shows in the accent colour</p>
            </div>
          </div>
        )}
      </div>

      {/* This station's deal list + editor */}
      <div className="grid gap-6 lg:grid-cols-12 items-start [&>*]:min-w-0">
        {/* Left: the station's deals */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide block">
              {campaignChannel === "channel1" ? "Band Deals" : "Slider Offers"} ({stationDeals.length}):
            </span>
            <Button
              size="sm"
              className="h-8 text-xs font-bold gap-1.5 bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl shadow-xs"
              onClick={() =>
                run(async () => {
                  const created = await createAnnouncement({
                    message:
                      stationPlacement === "band"
                        ? "🥞 New Special — 20% Off This Weekend!"
                        : "🥞 New Offer — 15% Off All Day!",
                    details:
                      stationPlacement === "band"
                        ? "This weekend only · Dine-in & Takeaway"
                        : "Everyday special · Dine-in & Takeaway",
                    link_text: "Explore Menu",
                    link_url: "/menu",
                    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=80",
                    is_active: false,
                    placement: stationPlacement,
                  });
                  setAnnouncements((xs) => [created, ...xs]);
                  setSelectedDealId(created.id);
                  // an old backend ignores `placement`, so the deal may land in the
                  // other station — follow it there instead of looking stuck
                  const landed = (created.placement ?? "slider") === "band" ? "channel1" : "channel2";
                  if (landed !== campaignChannel) setCampaignChannel(landed);
                }, "Campaign", {
                  title: "Deal created as hidden — edit it, then turn Show on",
                  description:
                    legacyBackend && stationPlacement === "band"
                      ? "Old backend: the deal was placed in the Offers Slider station for now"
                      : undefined,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> New Deal
            </Button>
          </div>

          {campaignChannel === "channel1" && bandUsingFallback && !legacyBackend && (
            <p className="text-[11px] font-bold text-amber-800 bg-white border border-zinc-200 rounded-xl p-2.5">
              No live band deal yet — the website is temporarily showing the newest slider offer in
              the band. Create a band deal and turn Show ON to take over.
            </p>
          )}

          <div className="grid gap-2.5 [&>*]:min-w-0">
            {stationDeals.map((a) => {
              const isSelected = (activeDeal?.id ?? null) === a.id;
              const isTopBanner = campaignChannel === "channel1" && a.id === topBannerId;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedDealId(a.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white border-[#763a12] shadow-xs"
                      : "bg-white border-zinc-200 hover:border-zinc-400 shadow-2xs"
                  }`}
                >
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border">
                    {a.image ? (
                      <Image src={a.image} alt={a.message} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-amber-600 bg-amber-50 font-bold">
                        🎫
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {isTopBanner && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-[#211a14] border border-amber-500">
                          Live in band
                        </span>
                      )}
                      {a.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                          Hidden
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-[#763a12] ml-auto">Editing</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#211a14] truncate">{a.message || "Untitled Deal"}</p>
                  </div>

                  <button
                    type="button"
                    title="Delete deal"
                    className="p-1.5 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await confirmDialog({
                        title: `Delete “${a.message}”?`,
                        description: "The deal disappears from the website immediately.",
                        confirmLabel: "Delete deal",
                        destructive: true,
                      });
                      if (!ok) return;
                      run(async () => {
                        await deleteAnnouncement(a.id);
                        setAnnouncements((xs) => xs.filter((x) => x.id !== a.id));
                        if (selectedDealId === a.id) setSelectedDealId(null);
                      }, "Campaign", { title: "Deal deleted" });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {stationDeals.length === 0 && !(campaignChannel === "channel1" && bandUsingFallback && !legacyBackend) && (
              <p className="text-xs text-zinc-500 p-3">
                {campaignChannel === "channel1"
                  ? "No band deals yet — create one with “New Deal”."
                  : "No slider offers yet — create one with “New Deal”."}
              </p>
            )}
          </div>
        </div>

        {/* Right: the editor for this station's selected deal */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-5">
          {activeDeal ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                <h4 className="text-sm font-semibold text-[#211a14] truncate max-w-full">
                  Edit: {activeDeal.message || "Untitled Deal"}
                </h4>
                <Button
                  size="sm"
                  className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                  loading={busy === "Campaign"}
                  onClick={() =>
                    run(async () => {
                      await updateAnnouncement(activeDeal.id, {
                        message: activeDeal.message,
                        details: activeDeal.details,
                        link_text: activeDeal.link_text,
                        link_url: activeDeal.link_url,
                        image: activeDeal.image,
                        starts_at: activeDeal.starts_at,
                        ends_at: activeDeal.ends_at,
                        card1_dish: activeDeal.card1_dish ?? "",
                        card2_dish: activeDeal.card2_dish ?? "",
                      });
                    }, "Campaign", { title: "Deal saved" })
                  }
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Save Deal
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-200 bg-white">
                <div>
                  <div className="text-xs font-semibold text-[#211a14]">Show on the Website?</div>
                  <div className="text-[11px] font-medium text-zinc-500">
                    {campaignChannel === "channel1"
                      ? "ON = the newest active band deal becomes the big band — saves instantly"
                      : "ON = appears in the offers slider — saves instantly"}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={activeDeal.is_active}
                    onCheckedChange={(v) =>
                      run(async () => {
                        await updateAnnouncement(activeDeal.id, { is_active: v });
                        setActiveDeal((a) => (a ? { ...a, is_active: v } : a));
                      }, "Deal visibility", { title: v ? "Deal is now live on the website" : "Deal hidden from the website" })
                    }
                  />
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    activeDeal.is_active ? "bg-emerald-100 text-emerald-950 border border-emerald-300" : "bg-zinc-200 text-zinc-700"
                  }`}>
                    {activeDeal.is_active ? "LIVE" : "HIDDEN"}
                  </span>
                </label>
              </div>

              {campaignChannel === "channel1" && (
                <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-2.5">
                  <span className="text-xs font-semibold text-[#211a14] block">Right-side Voucher Cards</span>
                  <p className="text-[10px] text-zinc-500 -mt-1">
                    The two little ticket cards on the band&apos;s right — pick any dish, or keep the
                    defaults. Saved with &ldquo;Save Deal&rdquo;.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#211a14]">Card 1 (left)</Label>
                      <Select
                        className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                        value={activeDeal.card1_dish ?? ""}
                        onChange={(e) =>
                          setActiveDeal((a) => (a ? { ...a, card1_dish: e.target.value } : a))
                        }
                      >
                        <option value="">The Offer photo (default)</option>
                        {menuItems.map((m) => (
                          <option key={m.slug} value={m.slug}>{m.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#211a14]">Card 2 (right)</Label>
                      <Select
                        className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                        value={activeDeal.card2_dish ?? ""}
                        onChange={(e) =>
                          setActiveDeal((a) => (a ? { ...a, card2_dish: e.target.value } : a))
                        }
                      >
                        <option value="">Auto — first hero-featured dish</option>
                        {menuItems.map((m) => (
                          <option key={m.slug} value={m.slug}>{m.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#211a14]">Deal Headline</Label>
                  <Input
                    className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                    value={activeDeal.message}
                    onChange={(e) => setActiveDeal((a) => (a ? { ...a, message: e.target.value } : a))}
                    placeholder="e.g. 🥞 20% OFF ALL PANCAKES BEFORE 11AM!"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#211a14]">Conditions &amp; Subtitle</Label>
                  <Input
                    className="border-zinc-300 text-[#211a14] font-medium text-sm h-10 rounded-xl"
                    value={activeDeal.details}
                    onChange={(e) => setActiveDeal((a) => (a ? { ...a, details: e.target.value } : a))}
                    placeholder="e.g. Weekend dine-in only · Available this week"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-[#211a14]">Button Text</Label>
                    <Input
                      className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                      value={activeDeal.link_text}
                      onChange={(e) => setActiveDeal((a) => (a ? { ...a, link_text: e.target.value } : a))}
                      placeholder="Explore Menu"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-[#211a14]">Button Link</Label>
                    <Input
                      className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                      value={activeDeal.link_url}
                      onChange={(e) => setActiveDeal((a) => (a ? { ...a, link_url: e.target.value } : a))}
                      placeholder="/menu"
                    />
                  </div>
                </div>

                {/* Run window — the website obeys these on its own */}
                <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-2.5">
                  <span className="text-xs font-semibold text-[#211a14] block">Schedule (Optional)</span>
                  <p className="text-[10px] text-zinc-500 -mt-1">
                    Leave blank to run forever. With an End set, the deal drops off the website by
                    itself at that moment — and the band shows a live countdown stamp. Saved with
                    &ldquo;Save Deal&rdquo;.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                    <div className="space-y-1">
                      <Label htmlFor="deal-starts" className="text-xs font-semibold text-[#211a14]">
                        Starts (optional)
                      </Label>
                      <Input
                        id="deal-starts"
                        type="datetime-local"
                        className="border-zinc-300 text-[#211a14] font-bold text-xs h-10 rounded-xl"
                        value={isoToLocalInput(activeDeal.starts_at)}
                        onChange={(e) =>
                          setActiveDeal((a) => (a ? { ...a, starts_at: localInputToIso(e.target.value) } : a))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="deal-ends" className="text-xs font-semibold text-[#211a14]">
                        Ends (optional)
                      </Label>
                      <Input
                        id="deal-ends"
                        type="datetime-local"
                        className="border-zinc-300 text-[#211a14] font-bold text-xs h-10 rounded-xl"
                        value={isoToLocalInput(activeDeal.ends_at)}
                        onChange={(e) =>
                          setActiveDeal((a) => (a ? { ...a, ends_at: localInputToIso(e.target.value) } : a))
                        }
                      />
                    </div>
                  </div>
                  {activeDeal.ends_at && new Date(activeDeal.ends_at).getTime() < Date.now() && (
                    <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-zinc-200 rounded-lg p-2">
                      This end time is in the past — the deal is already off the website.
                    </p>
                  )}
                </div>
                <ImageField
                  id="deal-image"
                  label="Deal Photo"
                  hint={
                    campaignChannel === "channel1"
                      ? "Shown inside the retro ticket frame on the right of the band"
                      : "Shown on the left side of the coupon ticket in the slider"
                  }
                  ratio="16 / 9"
                  value={activeDeal.image}
                  onChange={(e) => setActiveDeal((a) => (a ? { ...a, image: e.target.value } : a))}
                  onUploaded={(url) => setActiveDeal((a) => (a ? { ...a, image: url } : a))}
                />
              </div>
            </>
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-[#211a14]">No deal selected</p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Pick a deal from the list on the left to edit it — or press{" "}
                <strong>“New Deal”</strong> to create the first one for this station.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs font-bold border-zinc-300 text-[#763a12] rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous: Step 1 (Hero)</span>
        </Button>
        <Button
          type="button"
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(3)}
        >
          <span>Next: Step 3 (Photo Mosaic)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
