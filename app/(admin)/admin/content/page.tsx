"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Save,
  Home,
  ListOrdered,
  Award,
  Images,
  ExternalLink,
  Gift,
  Calendar,
  Eye,
  Coffee,
  Flame,
  Megaphone,
  Camera,
  Smartphone,
  Monitor,
  Ticket,
} from "lucide-react";
import {
  getSiteSettings,
  listAnnouncements,
  listCertifications,
  listHomeSteps,
  listMenu,
  listGalleryAdmin,
  updateSiteSettings,
  type AdminHomeStep,
  type AdminMenuItem,
  type AdminAnnouncement,
  type AdminCertification,
  type AdminGalleryPhoto,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { ContentSkeleton } from "./_components/ContentSkeleton";
import { BookingPageSection } from "./_components/BookingPageSection";
import { HomeStep1Hero } from "./_components/HomeStep1Hero";
import { HomeStep2Campaigns } from "./_components/HomeStep2Campaigns";
import { GalleryPageSection } from "./_components/GalleryPageSection";
import { HomeStep3Mosaic } from "./_components/HomeStep3Mosaic";
import { HomeStep4Badges } from "./_components/HomeStep4Badges";
import { HomeStep5Cta } from "./_components/HomeStep5Cta";
import { HomeStep6Footer } from "./_components/HomeStep6Footer";
import { MenuPageSection } from "./_components/MenuPageSection";
import { AdminError } from "@/components/ui/admin-error";
import { useToast, type ToastInput } from "@/components/ui/toast";

import {
  EMPTY_CERT,
  EMPTY_PHOTO,
  getDealCadence,
  type PageTab,
  type ViewportMode,
} from "./_lib";

export default function ContentPage() {
  // a reload used to dump staff back to Homepage step 1 — the studio remembers
  // where they were (tab, step, station, device). Restoring inside the lazy
  // initializers is hydration-safe here because the first paint is always the
  // loading skeleton, identical whatever these values are.
  const [saved] = useState<Record<string, unknown>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("studio-position") || "{}");
    } catch {
      return {};
    }
  });
  const [activePage, setActivePage] = useState<PageTab>(() =>
    ["home", "menu", "gallery", "booking"].includes(saved.page as string) ? (saved.page as PageTab) : "home",
  );
  const [homeStepIndex, setHomeStepIndex] = useState<number>(() =>
    typeof saved.step === "number" && saved.step >= 1 && saved.step <= 6 ? saved.step : 1,
  );
  const [viewport, setViewport] = useState<ViewportMode>(() =>
    saved.viewport === "mobile" ? "mobile" : "desktop",
  );
  const [campaignChannel, setCampaignChannel] = useState<"channel1" | "channel2">(() =>
    saved.channel === "channel2" ? "channel2" : "channel1",
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        "studio-position",
        JSON.stringify({ page: activePage, step: homeStepIndex, channel: campaignChannel, viewport }),
      );
    } catch { /* private mode etc. */ }
  }, [activePage, homeStepIndex, campaignChannel, viewport]);
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [certs, setCerts] = useState<AdminCertification[]>([]);
  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<string>("all");
  const [newPhoto, setNewPhoto] = useState(EMPTY_PHOTO);
  const [newCert, setNewCert] = useState(EMPTY_CERT);
  const [steps, setSteps] = useState<AdminHomeStep[]>([]);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useToast();

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getSiteSettings(),
      listAnnouncements(),
      listCertifications(),
      listGalleryAdmin(),
      listHomeSteps(),
      listMenu(),
    ])
      .then(([s, anns, cs, ps, st, menu]) => {
        setSite(s);
        setAnnouncements(anns);
        setSelectedDealId(anns[0]?.id ?? null);
        setCerts(cs);
        setPhotos(ps);
        setSteps(st);
        setMenuItems(menu);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load content settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The two homepage campaign surfaces are managed as separate stations:
  // station 1 = the band under the hero (changes often), station 2 = the
  // long-running offers slider after the menu. Old rows without a placement
  // count as slider.
  const stationPlacement = campaignChannel === "channel1" ? "band" : "slider";
  const stationDeals = announcements.filter((a) => (a.placement ?? "slider") === stationPlacement);
  // the live server hasn't run migration 0023 yet: no row carries a placement,
  // so the split can't work until the backend deploy
  const legacyBackend = announcements.length > 0 && announcements.every((a) => a.placement === undefined);

  const activeDeal =
    stationDeals.find((a) => a.id === selectedDealId) ?? stationDeals[0] ?? null;

  const setActiveDeal = (
    next: AdminAnnouncement | null | ((a: AdminAnnouncement | null) => AdminAnnouncement | null),
  ) => {
    const current = activeDeal;
    if (!current) return;
    setAnnouncements((xs) => {
      const value = typeof next === "function" ? next(current) : next;
      if (!value) return xs;
      return xs.map((a) => (a.id === current.id ? value : a));
    });
  };

  // Determine which section preview to show in the 1:1 public website frame
  const currentPreviewSection =
    activePage === "home"
      ? homeStepIndex === 1
        ? "hero"
        : homeStepIndex === 2
        ? campaignChannel === "channel1"
          ? "deals"
          : "deals_slider"
        : homeStepIndex === 3
        ? "mosaic"
        : homeStepIndex === 4
        ? "certs"
        : homeStepIndex === 5
        ? "cta"
        : "footer"
      : activePage;

  // Real-time postMessage sync with the 1:1 public iframe
  const syncPreview = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !site) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "PANCAKE_PREVIEW_SYNC",
        section: currentPreviewSection,
        site,
        announcement: activeDeal,
        section1Kicker: site.promo_kicker || "✨ TODAY'S FEATURED SPECIAL",
        section2Kicker: site.offers_kicker || "On Right Now",
        section2Title: site.offers_title || "This Week's Offers",
        customBadge: activeDeal ? getDealCadence(activeDeal) : "",
        certs,
        photos,
        steps,
        dishes: menuItems,
      },
      "*"
    );
  }, [currentPreviewSection, site, activeDeal, certs, photos, steps, menuItems]);

  useEffect(() => {
    syncPreview();
  }, [syncPreview]);

  // the iframe loads before its React listener mounts, so the very first sync
  // is lost — re-send everything whenever the preview announces itself ready.
  // It also reports its content height so the frame always fits exactly.
  const [previewH, setPreviewH] = useState(505);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "PANCAKE_PREVIEW_READY") syncPreview();
      if (e.data?.type === "PANCAKE_PREVIEW_SIZE" && typeof e.data.height === "number") {
        setPreviewH(Math.min(1400, Math.max(160, Math.ceil(e.data.height))));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [syncPreview]);

  const run = async (fn: () => Promise<void>, what: string, success?: ToastInput) => {
    setBusy(what);
    try {
      await fn();
      toast({ variant: "success", title: `${what} saved`, ...success });
    } catch (e) {
      toast({
        variant: "error",
        title: `${what} — could not save`,
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <ContentSkeleton />;
  }

  if (error && !site) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminError message={error} onRetry={load} />
      </div>
    );
  }

  if (!site) return null;

  const setS = (key: keyof AdminSiteSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSite((s) => (s ? { ...s, [key]: e.target.value } : s));

  // Which deal is the big top band right now: the newest ACTIVE band deal
  // inside its date window; if the band list is empty the website falls back
  // to the newest live slider deal (mirrors Announcement.current()).
  const nowMs = Date.now();
  const liveDeals = announcements.filter(
    (a) =>
      a.is_active &&
      (!a.starts_at || new Date(a.starts_at).getTime() <= nowMs) &&
      (!a.ends_at || new Date(a.ends_at).getTime() >= nowMs),
  );
  const topBannerId =
    (liveDeals.find((a) => (a.placement ?? "slider") === "band") ?? liveDeals[0])?.id ?? null;
  const bandUsingFallback =
    topBannerId !== null && !liveDeals.some((a) => (a.placement ?? "slider") === "band");

  // 4 Top Level Public Pages (Sleek Floating Pill Control)
  const PAGES = [
    {
      id: "home",
      label: "Homepage",
      path: "/",
      icon: Home,
      tag: "6 Sections Flow",
    },
    {
      id: "menu",
      label: "Menu Page",
      path: "/menu",
      icon: ListOrdered,
      tag: "Header & 3 Steps",
    },
    {
      id: "gallery",
      label: "Gallery Page",
      path: "/gallery",
      icon: Images,
      tag: `${photos.length} Photos`,
    },
    {
      id: "booking",
      label: "Booking Page",
      path: "/booking",
      icon: Calendar,
      tag: "Header & Form",
    },
  ] as const;

  // Exact step-by-step order of sections on the HOMEPAGE (top to bottom)
  const HOME_SECTIONS = [
    { num: 1, label: "Top Hero Banner", icon: Flame },
    { num: 2, label: "Campaigns & Offers (Both 2A & 2B)", icon: Gift },
    { num: 3, label: "Photo Mosaic", icon: Camera },
    { num: 4, label: "Trust Badges", icon: Award },
    { num: 5, label: "Booking Banner", icon: Megaphone },
    { num: 6, label: "Footer Tagline", icon: Coffee },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-28 text-[#211a14]">
      {/* ========================================================================= */}
      {/* 🌟 HERO BRAND BANNER — WARM GOURMET PANCAKE CLUB AESTHETIC                */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-sm">

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#211a14]">
              Site Content
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#763a12]/80 max-w-xl">
              Edit the website below — the preview shows exactly what visitors will see.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activePage === "home" ? "/" : `/${activePage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#763a12] bg-white/95 hover:bg-white p-3 px-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-xs transition-all shrink-0 group"
            >
              <Eye className="h-4 w-4 text-amber-600 transition-transform group-hover:scale-110" />
              <span>Open Live Website</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600" />
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🥞 LEVEL 1: SLEEK PAGE NAVIGATOR (CAPSULE PILLS)                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-zinc-100 rounded-lg border border-zinc-200">
        <div className="flex flex-wrap items-center gap-1.5 w-full">
          {PAGES.map((p) => {
            const Icon = p.icon;
            const isSelected = activePage === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePage(p.id as PageTab)}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
                  isSelected
                    ? "bg-[#763a12] text-white shadow-sm shadow-[#763a12]/30"
                    : "bg-white/60 hover:bg-white text-[#763a12] hover:text-[#211a14] border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-amber-300" : "text-[#763a12]/70"}`} />
                <span>{p.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/5 text-[#763a12]/60"
                  }`}
                >
                  {p.path}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏠 HOMEPAGE SECTIONS STUDIO                                               */}
      {/* ========================================================================= */}
      {activePage === "home" && (
        <div className="space-y-6">
          {/* Section Step Timeline Selector */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#763a12] flex items-center gap-2">
                <span>Homepage sections</span>
              </span>
              <div className="flex items-center gap-3">
                {/* Desktop / Mobile Preview Mode Switcher */}
                <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewport === "desktop"
                        ? "bg-[#763a12] text-white shadow-xs"
                        : "text-[#763a12] hover:text-[#211a14]"
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("mobile")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewport === "mobile"
                        ? "bg-[#763a12] text-white shadow-xs"
                        : "text-[#763a12] hover:text-[#211a14]"
                    }`}
                    title="Mobile Phone Preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>
                <span className="text-xs font-bold text-zinc-500 hidden sm:inline">
                  Step {homeStepIndex} of 6
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {HOME_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = homeStepIndex === sec.num;
                return (
                  <button
                    key={sec.num}
                    type="button"
                    onClick={() => setHomeStepIndex(sec.num)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      isActive
                        ? "bg-[#763a12] text-white border-[#763a12] shadow-xs"
                        : "bg-white hover:bg-zinc-50 text-[#211a14] border-zinc-200"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-zinc-100 text-[#763a12]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-semibold uppercase ${isActive ? "text-amber-300" : "text-zinc-400"}`}>
                        Step {sec.num}
                      </div>
                      <div className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-[#211a14]"}`}>
                        {sec.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 ONE PERSISTENT LIVE PREVIEW — never reloads, so no flash on switching   */}
      {/* ========================================================================= */}
      <div className="rounded-xl bg-white border border-zinc-200 p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white flex items-center gap-1.5 shadow-xs">
              {activePage === "home" ? "Live preview" : `Live preview — ${activePage} page`}
            </span>

            {/* Dual Campaign Channel Switcher in Step 2 */}
            {activePage === "home" && homeStepIndex === 2 && (
              <div className="inline-flex items-center bg-white p-1 rounded-lg border border-zinc-300 shadow-xs">
                <button
                  type="button"
                  onClick={() => setCampaignChannel("channel1")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    campaignChannel === "channel1"
                      ? "bg-[#763a12] text-white shadow-xs"
                      : "text-[#763a12] hover:text-[#211a14]"
                  }`}
                >
                  <Gift className="h-3.5 w-3.5" />
                  <span>Top Promo Band</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignChannel("channel2")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    campaignChannel === "channel2"
                      ? "bg-[#763a12] text-white shadow-xs"
                      : "text-[#763a12] hover:text-[#211a14]"
                  }`}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Weekly Offers Slider</span>
                </button>
              </div>
            )}
          </div>

          {activePage === "home" && (
            <Button
              size="sm"
              className="font-bold text-xs bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl shadow-xs"
              loading={busy === "All content"}
              onClick={() =>
                run(async () => {
                  await updateSiteSettings({
                    hero_heading: site.hero_heading,
                    hero_script: site.hero_script,
                    hero_lead: site.hero_lead,
                    hero_image: site.hero_image,
                    hero_cutout: site.hero_cutout,
                    promo_kicker: site.promo_kicker,
                    offers_kicker: site.offers_kicker,
                    offers_title: site.offers_title,
                    cta_heading: site.cta_heading,
                    cta_script: site.cta_script,
                    cta_lead: site.cta_lead,
                    cta_button_label: site.cta_button_label,
                    cta_button_url: site.cta_button_url,
                    footer_tagline: site.footer_tagline,
                  });
                }, "All content")
              }
            >
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Section Changes
            </Button>
          )}
        </div>

        {/* Simulated Public Device Frame */}
        <div className={`mx-auto transition-all ${activePage === "home" && viewport === "mobile" ? "max-w-[420px]" : "w-full"}`}>
          <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
            <iframe
              ref={iframeRef}
              src="/preview"
              onLoad={syncPreview}
              className="w-full border-0 transition-all"
              // height follows the preview's own content-size reports, so no
              // section ever renders clipped or with dead space below it
              style={{ height: `${previewH}px`, display: "block" }}
              title="Public Website Live Preview"
            />
          </div>
        </div>
      </div>

      {activePage === "home" && (
        <div className="space-y-6">

          {/* --------------------------------------------------------------------- */}
          {/* STEP 1: TOP HERO BANNER (INPUTS + 3-SLOT CAROUSEL STATION)            */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 1 && (
            <HomeStep1Hero
              site={site}
              setS={setS}
              setSite={setSite}
              menuItems={menuItems}
              setMenuItems={setMenuItems}
              run={run}
              setHomeStepIndex={setHomeStepIndex}
            />
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 2: TWO INDEPENDENT CAMPAIGN STATIONS (REAL SEPARATION)           */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 2 && (
            <HomeStep2Campaigns
              site={site}
              setS={setS}
              campaignChannel={campaignChannel}
              setCampaignChannel={setCampaignChannel}
              selectedDealId={selectedDealId}
              setSelectedDealId={setSelectedDealId}
              setAnnouncements={setAnnouncements}
              stationDeals={stationDeals}
              stationPlacement={stationPlacement}
              activeDeal={activeDeal}
              setActiveDeal={setActiveDeal}
              legacyBackend={legacyBackend}
              topBannerId={topBannerId}
              bandUsingFallback={bandUsingFallback}
              menuItems={menuItems}
              run={run}
              busy={busy}
              setHomeStepIndex={setHomeStepIndex}
            />
          )}


          {/* --------------------------------------------------------------------- */}
          {/* STEP 3: PHOTO MOSAIC (INPUTS)                                         */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 3 && (
            <HomeStep3Mosaic
              photos={photos}
              setPhotos={setPhotos}
              run={run}
              setHomeStepIndex={setHomeStepIndex}
              setActivePage={setActivePage}
            />
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 4: TRUST BADGES (INPUTS)                                         */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 4 && (
            <HomeStep4Badges
              certs={certs}
              setCerts={setCerts}
              newCert={newCert}
              setNewCert={setNewCert}
              run={run}
              setHomeStepIndex={setHomeStepIndex}
            />
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 5: BOTTOM BOOKING BANNER (INPUTS)                                */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 5 && (
            <HomeStep5Cta site={site} setS={setS} setHomeStepIndex={setHomeStepIndex} />
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 6: FOOTER TAGLINE (INPUTS)                                       */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 6 && (
            <HomeStep6Footer
              site={site}
              setS={setS}
              busy={busy}
              run={run}
              setHomeStepIndex={setHomeStepIndex}
              setActivePage={setActivePage}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🥞 PAGE 2: MENU PAGE STUDIO (/menu)                                       */}
      {/* ========================================================================= */}
      {activePage === "menu" && (
        <MenuPageSection
          site={site}
          setS={setS}
          steps={steps}
          setSteps={setSteps}
          busy={busy}
          run={run}
        />
      )}

      {/* ========================================================================= */}
      {/* 📸 PAGE 3: GALLERY STUDIO (/gallery)                                      */}
      {/* ========================================================================= */}
      {activePage === "gallery" && (
        <GalleryPageSection
          site={site}
          setS={setS}
          photos={photos}
          setPhotos={setPhotos}
          galleryFilter={galleryFilter}
          setGalleryFilter={setGalleryFilter}
          newPhoto={newPhoto}
          setNewPhoto={setNewPhoto}
          busy={busy}
          run={run}
        />
      )}

      {/* ========================================================================= */}
      {/* 📅 PAGE 4: BOOKING STUDIO (/booking)                                      */}
      {/* ========================================================================= */}
      {activePage === "booking" && (
        <BookingPageSection site={site} setS={setS} busy={busy} run={run} />
      )}
    </div>
  );
}
