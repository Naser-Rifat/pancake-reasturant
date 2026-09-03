"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Save,
  Home,
  ListOrdered,
  Tag,
  Award,
  Images,
  ExternalLink,
  Sparkles,
  Gift,
  Check,
  Calendar,
  Clock,
  Eye,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  Layers,
  ChevronRight,
  BadgePercent,
  BookOpen,
  Coffee,
  Flame,
  Megaphone,
  ShieldCheck,
  Heart,
  Star,
  Compass,
  Palette,
  Camera,
  Smartphone,
  Monitor,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  Ticket,
} from "lucide-react";
import {
  createAnnouncement,
  createCertification,
  deleteAnnouncement,
  createGalleryPhoto,
  deleteCertification,
  deleteGalleryPhoto,
  getSiteSettings,
  listAnnouncements,
  listCertifications,
  listHomeSteps,
  listMenu,
  updateMenuItem,
  updateGalleryPhoto,
  updateHomeStep,
  type AdminHomeStep,
  type AdminMenuItem,
  listGalleryAdmin,
  updateAnnouncement,
  updateCertification,
  updateSiteSettings,
  type AdminAnnouncement,
  type AdminCertification,
  type AdminGalleryPhoto,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/components/ui/upload-button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast, type ToastInput } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { CERT_ICONS } from "@/components/CertIcon";
import { ImageField } from "@/components/ui/image-field";

type PageTab = "home" | "menu" | "gallery" | "booking";
type ViewportMode = "desktop" | "mobile";
type CampaignFormat = "band" | "slider";
type DealCadence = "all" | "weekly" | "monthly" | "regular";

const EMPTY_PHOTO: Pick<AdminGalleryPhoto, "album" | "caption" | "image" | "alt"> = {
  album: "food",
  caption: "",
  image: "",
  alt: "",
};
const EMPTY_CERT = { icon: "medal", title: "", subtitle: "" };

function getDealCadence(a: AdminAnnouncement): "weekly" | "monthly" | "regular" {
  const t = `${a.message} ${a.details}`.toLowerCase();
  if (t.includes("month") || t.includes("monthly") || t.includes("30 day") || t.includes("september") || t.includes("october")) {
    return "monthly";
  }
  if (t.includes("week") || t.includes("weekend") || t.includes("brunch pass") || t.includes("tuesday") || t.includes("sunday")) {
    return "weekly";
  }
  return "regular";
}

export default function ContentPage() {
  const [activePage, setActivePage] = useState<PageTab>("home");
  const [homeStepIndex, setHomeStepIndex] = useState<number>(1);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [campaignChannel, setCampaignChannel] = useState<"channel1" | "channel2">("channel1");
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
  const { confirm: confirmDialog } = useConfirm();

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

  const run = async (fn: () => Promise<void>, what: string, success?: ToastInput) => {
    setBusy(what);
    try {
      await fn();
      toast({ variant: "success", title: `${what} saved! ✨`, ...success });
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
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="h-28 rounded-3xl bg-amber-500/10 animate-pulse border border-amber-500/20" />
        <div className="h-64 rounded-3xl bg-zinc-100 animate-pulse border" />
      </div>
    );
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

  const filteredPhotos =
    galleryFilter === "all" ? photos : photos.filter((p) => p.album === galleryFilter);

  // Featured dishes in order
  const featuredDishes = menuItems.filter((m) => m.is_featured);
  const featuredPrices = featuredDishes.map((m) => parseFloat(m.price)).filter((n) => !isNaN(n));
  const featuredPrice = featuredPrices.length ? Math.min(...featuredPrices) : 14;

  const slot2Dish = featuredDishes[0] ?? null;
  const slot3Dish = featuredDishes[1] ?? null;

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
    { num: 1, label: "Top Hero Banner", icon: Flame, color: "from-amber-500 to-orange-500" },
    { num: 2, label: "Campaigns & Offers (Both 2A & 2B)", icon: Gift, color: "from-rose-500 to-pink-500" },
    { num: 3, label: "Photo Mosaic", icon: Camera, color: "from-purple-500 to-indigo-500" },
    { num: 4, label: "Trust Badges", icon: Award, color: "from-emerald-500 to-teal-500" },
    { num: 5, label: "Booking Banner", icon: Megaphone, color: "from-orange-500 to-amber-600" },
    { num: 6, label: "Footer Tagline", icon: Coffee, color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-28 text-[#211a14]">
      {/* ========================================================================= */}
      {/* 🌟 HERO BRAND BANNER — WARM GOURMET PANCAKE CLUB AESTHETIC                */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#fff7e6] via-[#fef3d6] to-[#fde8bb] border-2 border-[#e6c88b] p-6 sm:p-8 shadow-sm">
        <div className="absolute right-[-20px] top-[-20px] text-8xl opacity-10 pointer-events-none select-none font-serif">
          🥞
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#763a12] text-white text-xs font-bold shadow-xs">
              <span>🥞 The Pancake Club</span>
              <span className="text-amber-300">·</span>
              <span className="text-amber-200">1:1 Real Live Visual Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#211a14]">
              Website Visual Content Studio
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#763a12]/80 max-w-xl">
              Type in the inputs below to see a <strong>100% same-to-same, pixel-perfect real preview</strong> using the authentic public website components and fonts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activePage === "home" ? "/" : `/${activePage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#763a12] bg-white/95 hover:bg-white p-3 px-4 rounded-2xl border border-[#e6c88b] shadow-sm hover:shadow-md transition-all shrink-0 group"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#f4ebe1] rounded-2xl border border-[#e4d3c2]">
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
                    ? "bg-[#763a12] text-white shadow-sm shadow-[#763a12]/30 scale-[1.02]"
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
          <div className="bg-[#fffdf9] p-4 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#763a12] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Homepage Chronological Flow:</span>
              </span>
              <div className="flex items-center gap-3">
                {/* Desktop / Mobile Preview Mode Switcher */}
                <div className="flex items-center bg-[#f4ebe1] p-1 rounded-xl border border-[#e4d3c2]">
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
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? "bg-[#763a12] text-white border-[#763a12] shadow-md scale-[1.03]"
                        : "bg-white hover:bg-[#faf5ee] text-[#211a14] border-[#e8dacb]"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-linear-to-br " + sec.color + " text-white shadow-2xs"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-black uppercase ${isActive ? "text-amber-300" : "text-zinc-400"}`}>
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

          {/* ========================================================================= */}
          {/* 🌟 100% SAME-TO-SAME AUTHENTIC PUBLIC WEBSITE LIVE IFRAME PREVIEW         */}
          {/* ========================================================================= */}
          <div className="rounded-3xl bg-[#f8f2e0] border-2 border-[#e3d1b6] p-4 sm:p-6 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#763a12] text-white flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  100% REAL SAME-TO-SAME PUBLIC PREVIEW
                </span>

                {/* Dual Campaign Channel Switcher in Step 2 */}
                {homeStepIndex === 2 && (
                  <div className="inline-flex items-center bg-white p-1 rounded-2xl border border-[#d9c7b4] shadow-xs">
                    <button
                      type="button"
                      onClick={() => setCampaignChannel("channel1")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
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
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
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
            </div>

            {/* Simulated Public Device Frame */}
            <div className={`mx-auto transition-all ${viewport === "mobile" ? "max-w-[420px]" : "w-full"}`}>
              <div className="rounded-3xl overflow-hidden border-2 border-[#e8dacb] shadow-xl bg-[var(--cream)]">
                <iframe
                  ref={iframeRef}
                  src={`/preview?section=${currentPreviewSection}`}
                  onLoad={syncPreview}
                  className="w-full border-0 transition-all"
                  style={{
                    height:
                      activePage === "home"
                        ? homeStepIndex === 1
                          ? viewport === "mobile"
                            ? "530px"
                            : "505px"
                          : homeStepIndex === 2
                          ? campaignChannel === "channel2"
                            ? viewport === "mobile"
                              ? "440px"
                              : "390px"
                            : viewport === "mobile"
                            ? "420px"
                            : "370px"
                          : homeStepIndex === 3
                          ? "320px"
                          : homeStepIndex === 4
                          ? "180px"
                          : homeStepIndex === 5
                          ? "280px"
                          : "110px"
                        : activePage === "menu"
                        ? "420px"
                        : "240px",
                    display: "block",
                  }}
                  title="Public Website Live Preview"
                />
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* STEP 1: TOP HERO BANNER (INPUTS + 3-SLOT CAROUSEL STATION)            */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 1 && (
            <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-[#eee3d5]">
                <Palette className="h-5 w-5 text-[#aa4c0a]" />
                <h3 className="text-base font-black text-[#211a14]">Edit Hero Text &amp; Images</h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-[#211a14]">1. Main Headline (Bold First Part)</Label>
                  <Input
                    className="border-[#d9c7b4] bg-white text-[#211a14] font-bold text-sm h-11 rounded-xl"
                    placeholder="e.g. Stack Into"
                    value={site.hero_heading}
                    onChange={setS("hero_heading")}
                  />
                  <p className="text-[11px] font-medium text-zinc-500">The chunky retro title</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-[#211a14]">2. Fancy Handwriting Word (Second Part)</Label>
                  <Input
                    className="border-[#d9c7b4] bg-white text-[#211a14] font-bold text-sm h-11 rounded-xl font-serif italic"
                    placeholder="e.g. Happiness"
                    value={site.hero_script}
                    onChange={setS("hero_script")}
                  />
                  <p className="text-[11px] font-medium text-zinc-500">Rendered in cursive script</p>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-black text-[#211a14]">3. Welcome Subtitle Tagline</Label>
                  <Textarea
                    rows={2}
                    className="border-[#d9c7b4] bg-white text-[#211a14] font-medium text-sm rounded-xl"
                    placeholder="e.g. We flip the best homemade pancakes in Sydney..."
                    value={site.hero_lead}
                    onChange={setS("hero_lead")}
                  />
                </div>

                <div className="sm:col-span-2 grid gap-5 md:grid-cols-2 p-5 rounded-2xl border border-[#ecdac7] bg-[#faf5ee]">
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
                <div className="sm:col-span-2 p-5 sm:p-6 rounded-3xl border-2 border-amber-300 bg-amber-50/40 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                    <div>
                      <h4 className="text-sm font-black text-[#211a14] uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        The 3 Hero Carousel Slides &amp; Live Price Tag
                      </h4>
                      <p className="text-xs font-medium text-zinc-600 mt-0.5">
                        These are the exact 3 slides shown on the public website hero switcher. Changes are saved instantly to the database!
                      </p>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-full bg-[#763a12] text-amber-300 text-xs font-black self-start sm:self-auto shadow-xs">
                      Live Price Tag: From ${featuredPrice}
                    </div>
                  </div>

                  {/* 3 Dedicated Slots */}
                  <div className="grid gap-4 sm:grid-cols-3 [&>*]:min-w-0">
                    {/* SLOT 1 */}
                    <div className="p-4 rounded-2xl border-2 border-amber-400 bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
                          Slide 1 (Main)
                        </span>
                        <span className="text-xs font-black text-amber-800">From ${featuredPrice}</span>
                      </div>
                      <div className="relative h-28 rounded-xl overflow-hidden bg-zinc-100 border">
                        {site.hero_image ? (
                          <Image src={site.hero_image} alt="Hero Stack" fill sizes="400px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🥞</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#211a14]">Signature Hero Stack</p>
                        <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Background Photo Above
                        </p>
                      </div>
                    </div>

                    {/* SLOT 2 */}
                    <div className="p-4 rounded-2xl border-2 border-[#763a12] bg-[#fffdf9] shadow-md ring-2 ring-[#763a12]/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#763a12] text-amber-300">
                          Slide 2 (Carousel)
                        </span>
                        <span className="text-xs font-black text-[#aa4c0a]">
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
                        <p className="text-xs font-black truncate text-[#211a14]">
                          {slot2Dish ? slot2Dish.name : "No dish chosen"}
                        </p>
                        <Select
                          className="h-9 text-xs border-[#d9c7b4] font-bold rounded-xl"
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
                            }, "Hero Slide 2", { title: "Slide 2 updated & saved! ⭐" });
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
                    <div className="p-4 rounded-2xl border-2 border-[#763a12] bg-[#fffdf9] shadow-md ring-2 ring-[#763a12]/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#763a12] text-amber-300">
                          Slide 3 (Carousel)
                        </span>
                        <span className="text-xs font-black text-[#aa4c0a]">
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
                        <p className="text-xs font-black truncate text-[#211a14]">
                          {slot3Dish ? slot3Dish.name : "No dish chosen"}
                        </p>
                        <Select
                          className="h-9 text-xs border-[#d9c7b4] font-bold rounded-xl"
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
                            }, "Hero Slide 3", { title: "Slide 3 updated & saved! ⭐" });
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
                    <span className="text-xs font-black text-[#763a12] uppercase tracking-wider block mb-2.5">
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
                              <p className="text-xs font-black truncate text-[#211a14]">{m.name}</p>
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
                                    ? `✓ ${m.name} removed from hero carousel`
                                    : `✓ ${m.name} added to hero carousel! ⭐`,
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee3d5]">
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
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 2: TWO INDEPENDENT CAMPAIGN STATIONS (REAL SEPARATION)           */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 2 && (
            <div className="space-y-6">
              {legacyBackend && (
                <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 leading-relaxed">
                  ⚠️ The live server is still running the old backend, so the Band/Slider split and the Section
                  Titles below can&apos;t save yet. For now every deal sits in the <strong>Offers Slider</strong>{" "}
                  station — edit them there. Everything here starts working after the next backend deploy
                  (migrations 0020–0023).
                </div>
              )}

              {/* Which station am I editing? */}
              <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-rose-50 via-pink-50 to-amber-50 border-2 border-rose-200 shadow-xs space-y-3">
                <p className="text-xs font-bold text-[#211a14] leading-relaxed">
                  ℹ️ <strong>Two separate campaign spots:</strong> the <strong>Top Deal Band</strong> sits under
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
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                      campaignChannel === "channel1"
                        ? "bg-rose-600 text-white shadow-md"
                        : "bg-white hover:bg-zinc-100 text-[#211a14] border border-rose-200"
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
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                      campaignChannel === "channel2"
                        ? "bg-[#763a12] text-white shadow-md"
                        : "bg-white hover:bg-zinc-100 text-[#211a14] border border-rose-200"
                    }`}
                  >
                    <Ticket className="h-4 w-4" />
                    <span>2. Offers Slider — long-running</span>
                  </button>
                </div>
              </div>

              {/* Section headings for the selected station */}
              <div className="p-5 rounded-3xl border-2 border-[#eee3d5] bg-white shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#eee3d5]">
                  <h4 className="text-sm font-black text-[#211a14]">
                    {campaignChannel === "channel1" ? "Top Band Section Title" : "Offers Slider Section Titles"}
                  </h4>
                  <span className="text-[11px] font-bold text-zinc-500">Saved by “Save Section Changes” up top</span>
                </div>
                {campaignChannel === "channel1" ? (
                  <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                    <div className="space-y-1">
                      <Label className="text-xs font-black text-[#211a14]">Band Kicker</Label>
                      <Input
                        className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
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
                      <Label className="text-xs font-black text-[#211a14]">Slider Eyebrow</Label>
                      <Input
                        className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                        value={site.offers_kicker ?? ""}
                        onChange={setS("offers_kicker")}
                        placeholder="On Right Now"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-black text-[#211a14]">Slider Title</Label>
                      <Input
                        className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
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
                    <span className="text-xs font-black text-[#763a12] uppercase tracking-wider block">
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
                          title: "New deal created as hidden — edit it, then turn Show ON",
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
                    <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      ⚠️ No live band deal yet — the website is temporarily showing the newest slider offer in
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
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#fffdf9] border-[#763a12] shadow-md ring-4 ring-[#763a12]/15"
                              : "bg-[#fffdf9] border-[#ecdac7] hover:border-zinc-400 shadow-2xs"
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
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-[#211a14] border border-amber-500">
                                  ⭐ Live in band
                                </span>
                              )}
                              {a.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                                  Hidden
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] font-black text-[#763a12] ml-auto">Editing</span>
                              )}
                            </div>
                            <p className="text-xs font-black text-[#211a14] truncate">{a.message || "Untitled Deal"}</p>
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
                <div className="lg:col-span-7 bg-[#fffdf9] p-6 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-5">
                  {activeDeal ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
                        <h4 className="text-sm font-black text-[#211a14] truncate max-w-full">
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
                              });
                            }, "Campaign", { title: "Deal saved!" })
                          }
                        >
                          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Deal
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#ecdac7] bg-[#faf5ee]">
                        <div>
                          <div className="text-xs font-black text-[#211a14]">Show on the Website?</div>
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
                              }, "Deal visibility", { title: v ? "Deal is now LIVE on the website" : "Deal hidden from the website" })
                            }
                          />
                          <span className={`text-xs px-2.5 py-1 rounded-full font-black ${
                            activeDeal.is_active ? "bg-emerald-100 text-emerald-950 border border-emerald-300" : "bg-zinc-200 text-zinc-700"
                          }`}>
                            {activeDeal.is_active ? "LIVE" : "HIDDEN"}
                          </span>
                        </label>
                      </div>

                      <div className="grid gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-black text-[#211a14]">Deal Headline</Label>
                          <Input
                            className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                            value={activeDeal.message}
                            onChange={(e) => setActiveDeal((a) => (a ? { ...a, message: e.target.value } : a))}
                            placeholder="e.g. 🥞 20% OFF ALL PANCAKES BEFORE 11AM!"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-black text-[#211a14]">Conditions &amp; Subtitle</Label>
                          <Input
                            className="border-[#d9c7b4] text-[#211a14] font-medium text-sm h-10 rounded-xl"
                            value={activeDeal.details}
                            onChange={(e) => setActiveDeal((a) => (a ? { ...a, details: e.target.value } : a))}
                            placeholder="e.g. Weekend dine-in only · Available this week"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                          <div className="space-y-1">
                            <Label className="text-xs font-black text-[#211a14]">Button Text</Label>
                            <Input
                              className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                              value={activeDeal.link_text}
                              onChange={(e) => setActiveDeal((a) => (a ? { ...a, link_text: e.target.value } : a))}
                              placeholder="Explore Menu"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-black text-[#211a14]">Button Link</Label>
                            <Input
                              className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl"
                              value={activeDeal.link_url}
                              onChange={(e) => setActiveDeal((a) => (a ? { ...a, link_url: e.target.value } : a))}
                              placeholder="/menu"
                            />
                          </div>
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
                      <div className="text-3xl">🎫</div>
                      <p className="text-sm font-black text-[#211a14]">No deal selected</p>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                        Pick a deal from the list on the left to edit it — or press{" "}
                        <strong>“New Deal”</strong> to create the first one for this station.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee3d5]">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-xs font-bold border-[#d9c7b4] text-[#763a12] rounded-xl whitespace-normal h-auto"
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
          )}


          {/* --------------------------------------------------------------------- */}
          {/* STEP 3: PHOTO MOSAIC (INPUTS)                                         */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 3 && (
            <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white uppercase tracking-wider">
                    📸 Section 3
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#211a14]">Homepage Polaroid Photo Mosaic</h3>
                    <p className="text-xs text-zinc-500">The 6 featured scrapbook photos displayed in the homepage gallery strip</p>
                  </div>
                </div>
              </div>

              {/* Upload Box */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 space-y-3">
                <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-purple-600" /> Upload New Photo to Homepage Strip:
                </span>
                <div className="grid gap-3 sm:grid-cols-5 [&>*]:min-w-0">
                  <Select
                    className="h-10 text-xs border-[#d9c7b4] font-bold rounded-xl"
                    value={newPhoto.album}
                    onChange={(e) =>
                      setNewPhoto((n) => ({
                        ...n,
                        album: e.target.value as AdminGalleryPhoto["album"],
                      }))
                    }
                  >
                    <option value="food">🥞 Food &amp; Dishes</option>
                    <option value="interior">☕ Interior &amp; Space</option>
                    <option value="events">✨ Events &amp; Parties</option>
                  </Select>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Input
                      className="h-10 text-xs border-[#d9c7b4] font-medium rounded-xl"
                      placeholder="Image URL or click upload"
                      value={newPhoto.image}
                      onChange={(e) => setNewPhoto((n) => ({ ...n, image: e.target.value }))}
                    />
                    <UploadButton onUploaded={(url) => setNewPhoto((n) => ({ ...n, image: url }))} />
                  </div>
                  <Input
                    className="h-10 text-xs border-[#d9c7b4] font-medium rounded-xl"
                    placeholder="Caption (e.g. Fluffy Berry Stack)"
                    value={newPhoto.caption}
                    onChange={(e) => setNewPhoto((n) => ({ ...n, caption: e.target.value }))}
                  />
                  <Button
                    className="h-10 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                    disabled={!newPhoto.image.trim() || !newPhoto.caption.trim()}
                    onClick={() =>
                      run(async () => {
                        const created = await createGalleryPhoto({
                          ...newPhoto,
                          sort_order: photos.length,
                        });
                        setPhotos((xs) => [...xs, created]);
                        setNewPhoto(EMPTY_PHOTO);
                      }, "Gallery", { title: "Photo added!" })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Photo
                  </Button>
                </div>
              </div>

              {/* 6 Polaroid Photos Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 pt-2">
                {photos.slice(0, 6).map((p, idx) => (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-2xl border-2 border-[#eee3d5] bg-white p-2 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                      <Image src={p.image} alt={p.caption} fill sizes="200px" className="object-cover" />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-950 text-white shadow-xs">
                        #{idx + 1}
                      </span>
                      <button
                        className="absolute right-1.5 top-1.5 rounded-lg bg-black/80 text-white p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive transition-opacity"
                        aria-label={`Delete photo “${p.caption || "Untitled"}”`}
                        onClick={async () => {
                          const ok = await confirmDialog({
                            title: `Delete “${p.caption || "this photo"}”?`,
                            description: "It is removed from the homepage strip and the gallery.",
                            confirmLabel: "Delete photo",
                            destructive: true,
                          });
                          if (!ok) return;
                          run(async () => {
                            await deleteGalleryPhoto(p.id);
                            setPhotos((xs) => xs.filter((x) => x.id !== p.id));
                          }, "Gallery", { title: "Photo deleted" });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-1.5 pt-2">
                      <p className="text-xs font-black truncate text-[#211a14]">{p.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee3d5]">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-xs font-bold border-[#d9c7b4] text-[#763a12] rounded-xl whitespace-normal h-auto"
                  onClick={() => setHomeStepIndex(2)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous: Step 2 (Deals &amp; Campaigns)</span>
                </Button>
                <Button
                  type="button"
                  className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
                  onClick={() => setHomeStepIndex(4)}
                >
                  <span>Next: Step 4 (Trust Badges)</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 4: TRUST BADGES (INPUTS)                                         */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 4 && (
            <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
                    🏅 Section 4
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#211a14]">Homepage Trust Badges &amp; Certifications</h3>
                    <p className="text-xs text-zinc-500">Quality seals, halal/organic stamps, and accreditation awards</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3.5">
                {certs.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border-2 border-[#eee3d5] bg-white shadow-2xs"
                  >
                    <Select
                      className="h-10 w-36 text-xs border-[#d9c7b4] font-bold rounded-xl"
                      value={c.icon}
                      onChange={(e) =>
                        setCerts((xs) =>
                          xs.map((x) => (x.id === c.id ? { ...x, icon: e.target.value } : x))
                        )
                      }
                    >
                      {!CERT_ICONS.includes(c.icon) && <option value={c.icon}>Custom: {c.icon}</option>}
                      {CERT_ICONS.map((ic) => (
                        <option key={ic} value={ic} className="capitalize">
                          {ic}
                        </option>
                      ))}
                    </Select>
                    <Input
                      className="min-w-44 flex-1 h-10 text-xs border-[#d9c7b4] text-[#211a14] font-black rounded-xl"
                      placeholder="Badge Name (e.g. 100% Pure Canadian Maple)"
                      value={c.title}
                      onChange={(e) =>
                        setCerts((xs) =>
                          xs.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x))
                        )
                      }
                    />
                    <Input
                      className="min-w-44 flex-1 h-10 text-xs border-[#d9c7b4] text-[#211a14] font-medium rounded-xl"
                      placeholder="Subtitle (Optional)"
                      value={c.subtitle}
                      onChange={(e) =>
                        setCerts((xs) =>
                          xs.map((x) => (x.id === c.id ? { ...x, subtitle: e.target.value } : x))
                        )
                      }
                    />
                    <label className="flex items-center gap-2 text-xs font-black px-3 py-1.5 bg-[#f4ebe1] rounded-xl border border-[#e4d3c2] cursor-pointer">
                      <Switch
                        checked={c.is_active}
                        onCheckedChange={(v) =>
                          run(async () => {
                            await updateCertification(c.id, { is_active: v });
                            setCerts((xs) =>
                              xs.map((x) => (x.id === c.id ? { ...x, is_active: v } : x))
                            );
                          }, "Certification", { title: v ? "Badge shown" : "Badge hidden" })
                        }
                      />
                      <span className="text-[#763a12]">{c.is_active ? "Shown" : "Hidden"}</span>
                    </label>
                    <Button
                      size="sm"
                      className="h-10 px-4 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
                      onClick={() =>
                        run(async () => {
                          await updateCertification(c.id, {
                            icon: c.icon,
                            title: c.title,
                            subtitle: c.subtitle,
                          });
                        }, "Certification", { title: "Badge updated!" })
                      }
                    >
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={async () => {
                        const ok = await confirmDialog({
                          title: `Delete “${c.title}”?`,
                          description: "The badge disappears from the homepage trust strip.",
                          confirmLabel: "Delete badge",
                          destructive: true,
                        });
                        if (!ok) return;
                        run(async () => {
                          await deleteCertification(c.id);
                          setCerts((xs) => xs.filter((x) => x.id !== c.id));
                        }, "Certification", { title: "Badge deleted" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add New Badge */}
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-emerald-600" /> Add New Badge:
                  </span>
                  <Select
                    className="h-10 w-36 text-xs border-[#d9c7b4] font-bold rounded-xl"
                    value={newCert.icon}
                    onChange={(e) => setNewCert((n) => ({ ...n, icon: e.target.value }))}
                  >
                    {CERT_ICONS.map((ic) => (
                      <option key={ic} value={ic} className="capitalize">
                        {ic}
                      </option>
                    ))}
                  </Select>
                  <Input
                    className="min-w-44 flex-1 h-10 text-xs border-[#d9c7b4] text-[#211a14] font-bold rounded-xl"
                    placeholder="Badge Name (e.g. Free Range Eggs)"
                    value={newCert.title}
                    onChange={(e) => setNewCert((n) => ({ ...n, title: e.target.value }))}
                  />
                  <Input
                    className="min-w-44 flex-1 h-10 text-xs border-[#d9c7b4] text-[#211a14] font-medium rounded-xl"
                    placeholder="Subtitle (Optional)"
                    value={newCert.subtitle}
                    onChange={(e) => setNewCert((n) => ({ ...n, subtitle: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    disabled={!newCert.title.trim()}
                    onClick={() =>
                      run(async () => {
                        const created = await createCertification({
                          ...newCert,
                          sort_order: certs.length,
                        });
                        setCerts((xs) => [...xs, created]);
                        setNewCert(EMPTY_CERT);
                      }, "Certification", { title: "New badge added!" })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Badge
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee3d5]">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-xs font-bold border-[#d9c7b4] text-[#763a12] rounded-xl whitespace-normal h-auto"
                  onClick={() => setHomeStepIndex(3)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous: Step 3 (Photos)</span>
                </Button>
                <Button
                  type="button"
                  className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
                  onClick={() => setHomeStepIndex(5)}
                >
                  <span>Next: Step 5 (Bottom Banner)</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 5: BOTTOM BOOKING BANNER (INPUTS)                                */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 5 && (
            <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-5">
              <h4 className="text-sm font-black text-[#211a14] pb-2 border-b border-[#eee3d5]">Customize Bottom Invitation</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-black text-[#211a14]">Headline Text</Label>
                  <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.cta_heading} onChange={setS("cta_heading")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-black text-[#211a14]">Handwriting Accent Word</Label>
                  <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.cta_script} onChange={setS("cta_script")} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-black text-[#211a14]">Short Invitation Description</Label>
                  <Textarea rows={2} className="border-[#d9c7b4] text-[#211a14] font-medium text-sm rounded-xl" value={site.cta_lead} onChange={setS("cta_lead")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-black text-[#211a14]">Button Text</Label>
                  <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.cta_button_label} onChange={setS("cta_button_label")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-black text-[#211a14]">Button Link URL</Label>
                  <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.cta_button_url} onChange={setS("cta_button_url")} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee3d5]">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-xs font-bold border-[#d9c7b4] text-[#763a12] rounded-xl whitespace-normal h-auto"
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
          )}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 6: FOOTER TAGLINE (INPUTS)                                       */}
          {/* --------------------------------------------------------------------- */}
          {homeStepIndex === 6 && (
            <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white uppercase tracking-wider">
                    🥞 Section 6
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#211a14]">Footer Brand Tagline</h3>
                    <p className="text-xs text-zinc-500">The founding line displayed next to the copyright on every page</p>
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
                <Label className="text-xs font-black text-[#211a14]">Footer Tagline</Label>
                <Input
                  className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-11 rounded-xl"
                  value={site.footer_tagline}
                  onChange={setS("footer_tagline")}
                  placeholder="e.g. Fluffy stacks · real maple · est. 1999"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#eee3d5]">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-xs font-bold border-[#d9c7b4] text-[#763a12] rounded-xl whitespace-normal h-auto"
                  onClick={() => setHomeStepIndex(5)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous: Step 5 (Bottom Banner)</span>
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
                  onClick={() => setActivePage("menu")}
                >
                  <span>Go To Next Page: Menu Page ➜</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🥞 PAGE 2: MENU PAGE STUDIO (/menu)                                       */}
      {/* ========================================================================= */}
      {activePage === "menu" && (
        <div className="space-y-6">
          {/* Real Preview of Menu Page */}
          <div className="rounded-3xl bg-[#f8f2e0] border-2 border-[#e3d1b6] p-4 sm:p-6 shadow-md space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#763a12] text-white inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              100% REAL MENU PAGE LIVE PREVIEW
            </span>
            <div className="rounded-3xl overflow-hidden border-2 border-[#e8dacb] shadow-xl bg-[var(--cream)]">
              <iframe
                ref={iframeRef}
                src="/preview?section=menu"
                onLoad={syncPreview}
                className="w-full border-0"
                style={{ height: "460px", display: "block" }}
                title="Menu Live Preview"
              />
            </div>
          </div>

          <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white uppercase tracking-wider">
                  Menu Header
                </span>
                <h3 className="text-base font-black text-[#211a14]">Menu Page Top Title</h3>
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
                <Label className="text-xs font-black text-[#211a14]">Main Word (e.g. Stacks On)</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.menu_hero_heading} onChange={setS("menu_hero_heading")} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Handwriting Word (e.g. Stacks.)</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.menu_hero_script} onChange={setS("menu_hero_script")} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Subtitle</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-medium text-sm h-10 rounded-xl" value={site.menu_hero_lead} onChange={setS("menu_hero_lead")} />
              </div>
            </div>
          </div>

          {/* 3-Step Pickup Cards */}
          <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white uppercase tracking-wider">
                  Pickup Guide
                </span>
                <h3 className="text-base font-black text-[#211a14]">3-Step Ordering Cards on /menu</h3>
              </div>
            </div>

            <div className="grid gap-3.5">
              {steps.map((st, i) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl border-2 border-[#eee3d5] bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#763a12] text-white">
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
                      <Label className="text-[11px] font-black text-[#211a14]">Title</Label>
                      <Input
                        className="h-10 text-xs border-[#d9c7b4] text-[#211a14] font-bold rounded-xl"
                        value={st.title}
                        onChange={(e) =>
                          setSteps((xs) =>
                            xs.map((x) => (x.id === st.id ? { ...x, title: e.target.value } : x))
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-black text-[#211a14]">Description</Label>
                      <Input
                        className="h-10 text-xs border-[#d9c7b4] text-[#211a14] font-medium rounded-xl"
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

          <div className="flex items-center justify-between p-5 rounded-3xl border-2 border-[#eee3d5] bg-white shadow-sm">
            <div>
              <h4 className="text-xs font-black text-[#211a14]">Want to add or edit pancake dishes, flavours &amp; prices?</h4>
              <p className="text-[11px] font-medium text-zinc-500">Dishes are managed in the dedicated Menu Catalog section.</p>
            </div>
            <Link
              href="/admin/menu"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-[#763a12] text-white hover:bg-[#5e2d0d] shadow-sm"
            >
              <span>Go to Menu Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📸 PAGE 3: GALLERY STUDIO (/gallery)                                      */}
      {/* ========================================================================= */}
      {activePage === "gallery" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#f8f2e0] border-2 border-[#e3d1b6] p-4 sm:p-6 shadow-md space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#763a12] text-white inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              100% REAL GALLERY PAGE LIVE PREVIEW
            </span>
            <div className="rounded-3xl overflow-hidden border-2 border-[#e8dacb] shadow-xl bg-[var(--cream)]">
              <iframe
                ref={iframeRef}
                src="/preview?section=gallery"
                onLoad={syncPreview}
                className="w-full border-0"
                style={{ height: "240px", display: "block" }}
                title="Gallery Live Preview"
              />
            </div>
          </div>

          <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white uppercase tracking-wider">
                  Gallery Header
                </span>
                <h3 className="text-base font-black text-[#211a14]">Gallery Top Title</h3>
              </div>
              <Button
                size="sm"
                className="font-bold text-xs bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
                loading={busy === "Gallery hero"}
                onClick={() =>
                  run(async () => {
                    await updateSiteSettings({
                      gallery_hero_kicker: site.gallery_hero_kicker,
                      gallery_hero_heading: site.gallery_hero_heading,
                      gallery_hero_script: site.gallery_hero_script,
                      gallery_hero_lead: site.gallery_hero_lead,
                    });
                  }, "Gallery hero")
                }
              >
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Header
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Small Top Kicker</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.gallery_hero_kicker} onChange={setS("gallery_hero_kicker")} placeholder="Feast Your Eyes" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Main Word</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.gallery_hero_heading} onChange={setS("gallery_hero_heading")} placeholder="The" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Handwriting Word</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.gallery_hero_script} onChange={setS("gallery_hero_script")} placeholder="Gallery." />
              </div>
              <div className="sm:col-span-3 space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Subtitle</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-medium text-sm h-10 rounded-xl" value={site.gallery_hero_lead} onChange={setS("gallery_hero_lead")} placeholder="Our food, our space, and the good times in between." />
              </div>
            </div>
          </div>

          <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white uppercase tracking-wider">
                  Photo Albums
                </span>
                <h3 className="text-base font-black text-[#211a14]">All Uploaded Photos ({photos.length})</h3>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-[#f4ebe1] rounded-2xl border border-[#e4d3c2]">
                {[
                  { id: "all", label: "All" },
                  { id: "food", label: "Food" },
                  { id: "interior", label: "Interior" },
                  { id: "events", label: "Events" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setGalleryFilter(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      galleryFilter === cat.id
                        ? "bg-[#763a12] text-white shadow-xs"
                        : "text-[#763a12] hover:text-[#211a14]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {filteredPhotos.map((p) => (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-[#eee3d5] bg-white p-2 shadow-xs hover:border-purple-300 transition-all"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                    <Image src={p.image} alt={p.caption} fill sizes="220px" className="object-cover" />
                    <Badge className="absolute left-1.5 top-1.5 capitalize text-[10px] font-black bg-zinc-950 text-white border-0">
                      {p.album}
                    </Badge>
                    <button
                      className="absolute right-1.5 top-1.5 rounded-lg bg-black/80 text-white p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive transition-opacity"
                      aria-label={`Remove photo “${p.caption || "Untitled"}”`}
                      onClick={async () => {
                        const ok = await confirmDialog({
                          title: `Remove “${p.caption || "this photo"}” from the gallery?`,
                          description: "It also leaves the homepage strip if it was one of the first six.",
                          confirmLabel: "Remove photo",
                          destructive: true,
                        });
                        if (!ok) return;
                        run(async () => {
                          await deleteGalleryPhoto(p.id);
                          setPhotos((xs) => xs.filter((x) => x.id !== p.id));
                        }, "Gallery", { title: "Photo removed" });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-1.5 pt-2">
                    <p className="text-xs font-black truncate text-[#211a14]">{p.caption || "Untitled"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 PAGE 4: BOOKING STUDIO (/booking)                                      */}
      {/* ========================================================================= */}
      {activePage === "booking" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#f8f2e0] border-2 border-[#e3d1b6] p-4 sm:p-6 shadow-md space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#763a12] text-white inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              100% REAL BOOKING PAGE LIVE PREVIEW
            </span>
            <div className="rounded-3xl overflow-hidden border-2 border-[#e8dacb] shadow-xl bg-[var(--cream)]">
              <iframe
                ref={iframeRef}
                src="/preview?section=booking"
                onLoad={syncPreview}
                className="w-full border-0"
                style={{ height: "240px", display: "block" }}
                title="Booking Live Preview"
              />
            </div>
          </div>

          <div className="bg-[#fffdf9] p-6 sm:p-8 rounded-3xl border-2 border-[#eee3d5] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eee3d5]">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
                  Booking Header
                </span>
                <h3 className="text-base font-black text-[#211a14]">Reservation Page Header</h3>
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
                <Label className="text-xs font-black text-[#211a14]">Small Top Kicker</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.booking_hero_kicker} onChange={setS("booking_hero_kicker")} placeholder="Reserve Online" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Main Word</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.booking_hero_heading} onChange={setS("booking_hero_heading")} placeholder="Book a" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Handwriting Word</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.booking_hero_script} onChange={setS("booking_hero_script")} placeholder="Table." />
              </div>
              <div className="sm:col-span-3 space-y-1">
                <Label className="text-xs font-black text-[#211a14]">Subtitle</Label>
                <Input className="border-[#d9c7b4] text-[#211a14] font-medium text-sm h-10 rounded-xl" value={site.booking_hero_lead} onChange={setS("booking_hero_lead")} placeholder="Pick a date, pick a time..." />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-5 rounded-3xl border-2 border-[#eee3d5] bg-white shadow-sm">
            <div>
              <h4 className="text-xs font-black text-[#211a14]">Want to view incoming customer table reservations?</h4>
              <p className="text-[11px] font-medium text-zinc-500">Check reservation dates, party sizes, and customer requests.</p>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-[#763a12] text-white hover:bg-[#5e2d0d] shadow-sm"
            >
              <span>View Bookings Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
