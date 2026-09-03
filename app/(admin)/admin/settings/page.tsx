"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  UtensilsCrossed,
  Clock,
  Palette,
  Mail,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  ExternalLink,
  Phone,
  MapPin,
  Share2,
  Sliders,
  Check,
  Send,
} from "lucide-react";
import {
  createHours,
  deleteHours,
  getSiteSettings,
  listHoursAdmin,
  updateHours,
  sendTestEmail,
  updateSiteSettings,
  type AdminHours,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast, type ToastInput } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { Switch } from "@/components/ui/switch";

type SettingsTab = "contact" | "kitchen" | "hours" | "theme";

const AU_TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Australia/Hobart",
  "Australia/Darwin",
];

const EMPTY_ROW = { label: "", opens: "09:00", closes: "17:00" };

const THEMES = [
  {
    value: "golden",
    label: "Golden Morning",
    desc: "Warm syrup tones with soft berry pink & lavender accents",
    swatches: ["#f2be45", "#f2789c", "#c7abf3"],
    bgPreview: "from-[#f2be45]/20 to-[#f2789c]/10",
    primary: "#f2be45",
  },
  {
    value: "berry",
    label: "Berry Crush",
    desc: "Vibrant wild berries with deep raspberry contrast",
    swatches: ["#f6aec6", "#c7abf3", "#a12857"],
    bgPreview: "from-[#f6aec6]/20 to-[#a12857]/10",
    primary: "#a12857",
  },
  {
    value: "mint",
    label: "Minty Fresh",
    desc: "Crisp botanical greens with warm golden syrup highlights",
    swatches: ["#b8e6c4", "#f2be45", "#1f7a52"],
    bgPreview: "from-[#b8e6c4]/20 to-[#1f7a52]/10",
    primary: "#1f7a52",
  },
  {
    value: "choco",
    label: "Choc Latte",
    desc: "Cozy roasted cacao, warm biscuit cream & espresso",
    swatches: ["#e9c99b", "#eda45f", "#7a4520"],
    bgPreview: "from-[#e9c99b]/20 to-[#7a4520]/10",
    primary: "#7a4520",
  },
  {
    value: "maple",
    label: "Maple Gold",
    desc: "Signature diner palette with golden maple & dark mahogany",
    swatches: ["#efbf38", "#e08600", "#763a12"],
    bgPreview: "from-[#efbf38]/20 to-[#763a12]/10",
    primary: "#763a12",
  },
] as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function SettingsPage() {
  // remember the open tab across reloads (safe in a lazy initializer — the
  // first paint is always the loading skeleton, identical for every tab)
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window === "undefined") return "contact";
    try {
      const t = localStorage.getItem("settings-tab");
      return t === "kitchen" || t === "hours" || t === "theme" ? t : "contact";
    } catch {
      return "contact";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("settings-tab", activeTab);
    } catch { /* private mode etc. */ }
  }, [activeTab]);
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [hours, setHours] = useState<AdminHours[]>([]);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useToast();
  const { confirm: confirmDialog } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([getSiteSettings(), listHoursAdmin()])
      .then(([s, h]) => {
        setSite(s);
        setHours(h);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>, what: string, success?: ToastInput) => {
    setBusy(what);
    try {
      await fn();
      toast({ variant: "success", title: `${what} saved`, ...success });
    } catch (e) {
      toast({
        variant: "error",
        title: `${what} — action failed`,
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy("");
    }
  };

  const setS = (key: keyof AdminSiteSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setSite((s) => (s ? { ...s, [key]: e.target.value } : s));

  // Helper to format 24h to 12h for friendly display
  const formatTime12h = (t: string) => {
    if (!t) return "";
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${mStr || "00"} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-6 rounded-xl bg-white border border-zinc-200">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !site) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-white border border-zinc-200">
          <h1 className="text-2xl font-semibold text-[#211a14]">Business Settings</h1>
          <p className="text-xs font-medium text-zinc-500">
            Manage your restaurant location, kitchen ordering, operating hours, and appearance
          </p>
        </div>
        <AdminError message={error} onRetry={load} />
      </div>
    );
  }

  if (!site) return null;

  const TABS = [
    {
      id: "contact",
      label: "Business & Contact",
      icon: Building2,
      desc: "Address, phone, WhatsApp & social",
      badge: "Core Info",
    },
    {
      id: "kitchen",
      label: "Kitchen & Ordering",
      icon: UtensilsCrossed,
      desc: site.online_ordering_enabled ? "Active — Taking orders" : "Paused — Checkout disabled",
      badge: site.online_ordering_enabled ? "Live" : "Paused",
      isAlert: !site.online_ordering_enabled,
    },
    {
      id: "hours",
      label: "Trading Hours",
      icon: Clock,
      desc: `${hours.length} schedule rows active`,
      badge: `${hours.length} Days`,
    },
    {
      id: "theme",
      label: "Colors & Theme",
      icon: Palette,
      desc: "Palette presets & brand colors",
      badge: "Branding",
    },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#211a14] tracking-tight">
            Settings
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Ordering, trading hours, contact details and website theme.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-[#763a12] hover:bg-zinc-50 shadow-2xs transition-all"
          >
            <span>View Public Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Modern Segmented Tab Bar */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 [&>*]:min-w-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`relative flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                isActive
                  ? "bg-[#763a12] text-white border-[#763a12] shadow-xs"
                  : "bg-white text-[#211a14] border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-2xs"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5 w-full mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                      isActive ? "bg-white/20 text-amber-300" : "bg-zinc-100 text-[#763a12]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold">{tab.label}</span>
                </div>
                {"badge" in tab && tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? "bg-white text-[#763a12]"
                        : "isAlert" in tab && tab.isAlert
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] line-clamp-1 font-medium ${
                  isActive ? "text-amber-100" : "text-zinc-500"
                }`}
              >
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BUSINESS & CONTACT DETAILS                                         */}
      {/* ========================================================================= */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            {/* Card Header with Save Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#763a12]" />
                  <h3 className="text-base font-semibold text-[#211a14]">Business &amp; Contact Details</h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Displayed on the website footer, receipts, location card, and confirmation emails
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                loading={busy === "Settings"}
                onClick={() =>
                  run(async () => {
                    await updateSiteSettings({
                      address: site.address,
                      phone: site.phone,
                      whatsapp: site.whatsapp,
                      email: site.email,
                      abn: site.abn,
                      timezone: site.timezone,
                      map_embed: site.map_embed,
                      instagram_url: site.instagram_url,
                      facebook_url: site.facebook_url,
                      uber_eats_url: site.uber_eats_url,
                    });
                  }, "Settings", { title: "Contact info saved" })
                }
              >
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Contact Info
              </Button>
            </div>

            {/* SECTION A: Core Contact & Legal Details */}
            <div className="space-y-4">
              <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Primary Contact &amp; Legal Info:
              </span>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="s-address" className="text-xs font-semibold text-[#211a14]">
                    Street Address (Display on Footer &amp; Booking)
                  </Label>
                  <Input
                    id="s-address"
                    className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                    placeholder="e.g. 123 Pancake Lane, Sydney NSW 2000"
                    value={site.address}
                    onChange={setS("address")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-phone" className="text-xs font-semibold text-[#211a14]">
                    Direct Phone Number
                  </Label>
                  <Input
                    id="s-phone"
                    className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                    placeholder="e.g. (02) 9876 5432"
                    value={site.phone}
                    onChange={setS("phone")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-wa" className="text-xs font-semibold text-[#211a14]">
                    WhatsApp Direct Order (Optional)
                  </Label>
                  <Input
                    id="s-wa"
                    className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                    placeholder="+61 4xx xxx xxx"
                    value={site.whatsapp}
                    onChange={setS("whatsapp")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-email" className="text-xs font-semibold text-[#211a14]">
                    Public Inquiries &amp; Alert Email
                  </Label>
                  <Input
                    id="s-email"
                    type="email"
                    className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                    placeholder="orders@pancakediner.com.au"
                    value={site.email}
                    onChange={setS("email")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="s-abn" className="text-xs font-semibold text-[#211a14]">
                    ABN (Australian Business Number)
                  </Label>
                  <Input
                    id="s-abn"
                    className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                    placeholder="e.g. 12 345 678 901"
                    value={site.abn}
                    onChange={setS("abn")}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="s-tz" className="text-xs font-semibold text-[#211a14]">
                    Venue Operating Timezone
                  </Label>
                  <Select
                    id="s-tz"
                    className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                    value={site.timezone}
                    onChange={setS("timezone")}
                  >
                    {AU_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* SECTION B: Social & Delivery Platform Integrations */}
            <div className="pt-4 border-t border-zinc-200 space-y-4">
              <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Social Media &amp; Online Delivery Links:
              </span>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="flex items-center gap-2 text-[#763a12]">
                    <InstagramIcon className="h-4 w-4 text-pink-600" />
                    <Label htmlFor="s-insta" className="text-xs font-semibold text-[#211a14]">
                      Instagram Page
                    </Label>
                  </div>
                  <Input
                    id="s-insta"
                    className="border-zinc-300 bg-white text-[#211a14] font-medium text-xs h-9 rounded-xl"
                    placeholder="https://instagram.com/pancakediner"
                    value={site.instagram_url}
                    onChange={setS("instagram_url")}
                  />
                </div>

                <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="flex items-center gap-2 text-[#763a12]">
                    <FacebookIcon className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="s-fb" className="text-xs font-semibold text-[#211a14]">
                      Facebook Page
                    </Label>
                  </div>
                  <Input
                    id="s-fb"
                    className="border-zinc-300 bg-white text-[#211a14] font-medium text-xs h-9 rounded-xl"
                    placeholder="https://facebook.com/pancakediner"
                    value={site.facebook_url}
                    onChange={setS("facebook_url")}
                  />
                </div>

                <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="flex items-center gap-2 text-[#763a12]">
                    <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                    <Label htmlFor="s-uber" className="text-xs font-semibold text-[#211a14]">
                      Uber Eats Store Link
                    </Label>
                  </div>
                  <Input
                    id="s-uber"
                    className="border-zinc-300 bg-white text-[#211a14] font-medium text-xs h-9 rounded-xl"
                    placeholder="https://www.ubereats.com/store/..."
                    value={site.uber_eats_url}
                    onChange={setS("uber_eats_url")}
                  />
                </div>
              </div>
            </div>

            {/* SECTION C: Google Maps Embed URL */}
            <div className="pt-4 border-t border-zinc-200 space-y-3">
              <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Interactive Location Map (Google Maps Embed):
              </span>
              <div className="space-y-1">
                <Label htmlFor="s-map" className="text-xs font-semibold text-[#211a14]">
                  Google Maps Embed iFrame Source URL (src=&quot;...&quot;)
                </Label>
                <Input
                  id="s-map"
                  className="border-zinc-300 text-[#211a14] font-mono text-xs h-10 rounded-xl"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  value={site.map_embed}
                  onChange={setS("map_embed")}
                />
                <p className="text-[10px] text-zinc-500">
                  Tip: On Google Maps, click Share → Embed a map → Copy HTML and paste the URL from <code>src=&quot;...&quot;</code> here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KITCHEN & ORDERING STATUS                                          */}
      {/* ========================================================================= */}
      {activeTab === "kitchen" && (
        <div className="space-y-6">
          {/* Main Hero Card for Ordering Status */}
          <div
            className={`p-6 sm:p-8 rounded-xl border transition-all shadow-sm space-y-6 ${
              site.online_ordering_enabled
                ? "bg-white border-emerald-300"
                : "bg-white border-amber-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      site.online_ordering_enabled
                        ? "bg-emerald-500 ring-4 ring-emerald-200"
                        : "bg-amber-500 ring-4 ring-amber-200"
                    }`}
                  />
                  <h3 className="text-base font-semibold text-[#211a14]">
                    {site.online_ordering_enabled
                      ? "Online ordering is on"
                      : "Online ordering is paused"}
                  </h3>
                </div>
                <p className="text-xs text-zinc-600 max-w-xl">
                  {site.online_ordering_enabled
                    ? "Customers can add items to cart and complete checkout on the menu page. Flip the switch to pause checkout during peak kitchen rushes."
                    : "Customers can view the menu, but checkout is paused. A friendly notice directs them to call the diner or order on Uber Eats."}
                </p>
              </div>

              {/* Big High-Visibility Master Toggle */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 bg-white shadow-xs shrink-0">
                <Switch
                  checked={site.online_ordering_enabled}
                  disabled={busy === "OrderingToggle"}
                  onCheckedChange={(v) => {
                    setSite((s) => (s ? { ...s, online_ordering_enabled: v } : s));
                    run(
                      async () => {
                        try {
                          await updateSiteSettings({ online_ordering_enabled: v });
                        } catch (e) {
                          // roll the optimistic flip back so the UI never lies
                          setSite((s) => (s ? { ...s, online_ordering_enabled: !v } : s));
                          throw e;
                        }
                      },
                      "OrderingToggle",
                      {
                        title: v ? "Online ordering ENABLED" : "Online ordering PAUSED",
                        description: v
                          ? "Customers can now order takeaway from the website"
                          : "Checkout is now paused on the website",
                      }
                    );
                  }}
                />
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide ${
                    site.online_ordering_enabled
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-amber-600 text-white shadow-xs"
                  }`}
                >
                  {site.online_ordering_enabled ? "ACTIVE" : "PAUSED"}
                </span>
              </div>
            </div>

            {/* Custom Pause Notice Message */}
            {!site.online_ordering_enabled && (
              <div className="p-5 rounded-lg border border-amber-300 bg-amber-50/70 space-y-3">
                <div className="flex items-center gap-2 text-amber-950 font-semibold text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Custom Message Displayed to Visitors on the Menu Page:</span>
                </div>
                <Textarea
                  id="pause-msg"
                  rows={2}
                  className="bg-white border-amber-300 text-xs font-bold text-[#211a14] rounded-xl"
                  placeholder="e.g. Our kitchen is currently busy with dine-in service! Please call us or order through Uber Eats."
                  value={site.online_ordering_disabled_message}
                  onChange={(e) =>
                    setSite((s) => (s ? { ...s, online_ordering_disabled_message: e.target.value } : s))
                  }
                />
                <Button
                  size="sm"
                  className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl"
                  loading={busy === "PauseMessage"}
                  onClick={() =>
                    run(
                      async () => {
                        await updateSiteSettings({
                          online_ordering_disabled_message: site.online_ordering_disabled_message,
                        });
                      },
                      "PauseMessage",
                      { title: "Pause notice saved" }
                    )
                  }
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Pause Message
                </Button>
              </div>
            )}
          </div>

          {/* Email Diagnostics Card */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-semibold text-[#211a14]">Email delivery</h4>
                  <p className="text-xs text-zinc-500">
                    Send a test email to check that confirmations and staff alerts are being delivered
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#211a14]">Send a test email</p>
                <p className="text-xs text-zinc-600">
                  Sends a test message to <strong>{site.email || "the configured staff inbox"}</strong>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="font-bold text-xs border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 rounded-xl shrink-0"
                loading={busy === "TestEmail"}
                onClick={async () => {
                  setBusy("TestEmail");
                  try {
                    const res = await sendTestEmail();
                    if (!res.ok) throw new Error(res.detail);
                    toast({
                      variant: res.detail.includes("NOT") ? "info" : "success",
                      title: res.detail.includes("NOT")
                        ? "Email not configured yet"
                        : `Test email dispatched to ${res.to}`,
                      description: res.detail,
                    });
                  } catch (e) {
                    toast({
                      variant: "error",
                      title: "Test email failed",
                      description: e instanceof Error ? e.message : undefined,
                    });
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Send Test Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRADING & OPERATING HOURS                                          */}
      {/* ========================================================================= */}
      {activeTab === "hours" && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#763a12]" />
                <h3 className="text-base font-semibold text-[#211a14]">Restaurant Trading Hours</h3>
              </div>
              <p className="text-xs text-zinc-500">
                Opening and closing schedule displayed on the homepage, booking calendar, and footer board
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {hours.map((h, idx) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs hover:border-zinc-300 transition-all"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                  <span className="h-7 w-7 rounded-xl bg-zinc-100 text-[#763a12] text-xs font-semibold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <Input
                    className="h-10 text-xs font-bold border-zinc-300 rounded-xl text-[#211a14]"
                    placeholder="e.g. Monday – Thursday"
                    value={h.label}
                    onChange={(e) =>
                      setHours((xs) =>
                        xs.map((x) => (x.id === h.id ? { ...x, label: e.target.value } : x))
                      )
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    className="w-24 sm:w-28 h-10 text-xs font-bold border-zinc-300 rounded-xl text-center"
                    value={h.opens.slice(0, 5)}
                    onChange={(e) =>
                      setHours((xs) =>
                        xs.map((x) => (x.id === h.id ? { ...x, opens: e.target.value } : x))
                      )
                    }
                  />
                  <span className="text-zinc-400 text-xs font-semibold">TO</span>
                  <Input
                    type="time"
                    className="w-24 sm:w-28 h-10 text-xs font-bold border-zinc-300 rounded-xl text-center"
                    value={h.closes.slice(0, 5)}
                    onChange={(e) =>
                      setHours((xs) =>
                        xs.map((x) => (x.id === h.id ? { ...x, closes: e.target.value } : x))
                      )
                    }
                  />

                  {/* Formatted AM/PM Badge */}
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-amber-900 shrink-0">
                    {formatTime12h(h.opens)} – {formatTime12h(h.closes)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="h-10 px-3.5 bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                    onClick={() =>
                      run(
                        async () => {
                          await updateHours(h.id, {
                            label: h.label,
                            opens: h.opens,
                            closes: h.closes,
                          });
                        },
                        "Hours",
                        { title: `Schedule updated for ${h.label}` }
                      )
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
                        title: `Delete schedule for “${h.label || "this day"}”?`,
                        description: "This schedule row will be removed from the public website.",
                        confirmLabel: "Delete schedule row",
                        destructive: true,
                      });
                      if (!ok) return;
                      run(async () => {
                        await deleteHours(h.id);
                        setHours((xs) => xs.filter((x) => x.id !== h.id));
                      }, "Hours", { title: "Schedule row deleted" });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add New Schedule Row Box */}
            <div className="p-5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 space-y-3">
              <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-[#763a12]" /> Add New Trading Schedule Row:
              </span>
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Input
                    className="h-10 text-xs font-bold border-zinc-300 bg-white rounded-xl"
                    placeholder="Day label (e.g. Friday – Sunday or Public Holidays)"
                    value={newRow.label}
                    onChange={(e) => setNewRow((n) => ({ ...n, label: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-2">
                  <Input
                    type="time"
                    className="w-full h-10 text-xs font-bold border-zinc-300 bg-white rounded-xl text-center"
                    value={newRow.opens}
                    onChange={(e) => setNewRow((n) => ({ ...n, opens: e.target.value }))}
                  />
                  <span className="text-zinc-400 text-xs font-bold">–</span>
                  <Input
                    type="time"
                    className="w-full h-10 text-xs font-bold border-zinc-300 bg-white rounded-xl text-center"
                    value={newRow.closes}
                    onChange={(e) => setNewRow((n) => ({ ...n, closes: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Button
                    size="sm"
                    className="w-full h-10 bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                    disabled={!newRow.label.trim()}
                    onClick={() =>
                      run(async () => {
                        const created = await createHours({
                          ...newRow,
                          sort_order: hours.length,
                        });
                        setHours((xs) => [...xs, created]);
                        setNewRow(EMPTY_ROW);
                      }, "Hours", { title: "Row added" })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: THEME & COLOR BRANDING                                             */}
      {/* ========================================================================= */}
      {activeTab === "theme" && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#763a12]" />
                <h3 className="text-base font-semibold text-[#211a14]">Website Color Palette &amp; Theme</h3>
              </div>
              <p className="text-xs text-zinc-500">
                Choose a curated designer theme preset or enter custom hex branding colors
              </p>
            </div>
          </div>

          {/* Theme Preset Cards */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide block">
              Theme presets:
            </span>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
              {THEMES.map((t) => {
                const isSelected = site.theme === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      run(
                        async () => {
                          await updateSiteSettings({ theme: t.value });
                          setSite((s) => (s ? { ...s, theme: t.value } : s));
                        },
                        "Theme",
                        {
                          title: `${t.label} theme applied`,
                          description: "Website colors updated live.",
                        }
                      )
                    }
                    className={`relative rounded-lg border p-4 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-[#763a12] bg-white shadow-xs"
                        : "border-zinc-200 bg-white hover:border-zinc-400 shadow-2xs"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {t.swatches.map((c) => (
                            <span
                              key={c}
                              className="h-4 w-4 rounded-full border border-black/10 shadow-2xs"
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                        {isSelected && (
                          <span className="h-5 w-5 rounded-full bg-[#763a12] text-white flex items-center justify-center text-[10px] font-bold">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#211a14]">{t.label}</div>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{t.desc}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-200">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide ${
                          isSelected ? "text-[#763a12]" : "text-zinc-400"
                        }`}
                      >
                        {isSelected ? "Active on website" : "Click to apply"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Mini Preview — tinted with the ACTIVE theme's colours */}
          {(() => {
            const active = THEMES.find((t) => t.value === site.theme);
            const primary = site.theme === "custom" ? site.custom_primary : active?.primary ?? "#763a12";
            const accent = site.theme === "custom" ? site.custom_accent : active?.swatches[0] ?? "#efbf38";
            return (
              <div className="p-5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#763a12] flex items-center gap-1.5">
                    Sample preview:
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#763a12] border border-zinc-300">
                    Current Active: {site.theme.toUpperCase()}
                  </span>
                </div>

                <div
                  className="p-4 rounded-xl bg-white border shadow-xs flex flex-wrap items-center justify-between gap-4"
                  style={{ borderColor: accent }}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: primary }}>
                      SAMPLE SPECIAL DEAL
                    </span>
                    <h4 className="text-sm font-semibold text-[#211a14]">
                      Fluffy Classic Buttermilk Stack with Pure Maple
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs"
                      style={{ background: primary }}
                    >
                      ORDER NOW →
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border"
                      style={{ color: primary, borderColor: accent }}
                    >
                      VIEW MENU
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Custom Palette Override Section */}
          <div
            className={`p-5 rounded-lg border transition-all ${
              site.theme === "custom"
                ? "border-[#763a12] bg-white"
                : "border-zinc-200 bg-zinc-50"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-[#211a14]">Custom Brand Color Palette</h4>
                <p className="text-[11px] text-zinc-600">
                  Override presets and define custom primary and accent hex codes
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="c-primary" className="text-xs font-bold text-[#211a14]">
                    Primary:
                  </Label>
                  <Input
                    id="c-primary"
                    type="color"
                    className="h-9 w-14 p-1 cursor-pointer rounded-xl border-zinc-300"
                    value={site.custom_primary}
                    onChange={setS("custom_primary")}
                  />
                  <span className="text-xs font-mono font-bold text-zinc-600">
                    {site.custom_primary}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="c-accent" className="text-xs font-bold text-[#211a14]">
                    Accent:
                  </Label>
                  <Input
                    id="c-accent"
                    type="color"
                    className="h-9 w-14 p-1 cursor-pointer rounded-xl border-zinc-300"
                    value={site.custom_accent}
                    onChange={setS("custom_accent")}
                  />
                  <span className="text-xs font-mono font-bold text-zinc-600">
                    {site.custom_accent}
                  </span>
                </div>

                <Button
                  size="sm"
                  className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                  loading={busy === "Theme"}
                  onClick={() =>
                    run(
                      async () => {
                        await updateSiteSettings({
                          theme: "custom",
                          custom_primary: site.custom_primary,
                          custom_accent: site.custom_accent,
                        });
                        setSite((s) => (s ? { ...s, theme: "custom" } : s));
                      },
                      "Theme",
                      { title: "Custom theme applied" }
                    )
                  }
                >
                  Apply Custom Colors
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
