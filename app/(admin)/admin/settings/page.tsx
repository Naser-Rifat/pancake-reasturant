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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast, type ToastInput } from "@/components/ui/toast";

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
  { value: "golden", label: "Golden Morning", swatches: ["#f2be45", "#f2789c", "#c7abf3"] },
  { value: "berry", label: "Berry Crush", swatches: ["#f6aec6", "#c7abf3", "#a12857"] },
  { value: "mint", label: "Minty Fresh", swatches: ["#b8e6c4", "#f2be45", "#1f7a52"] },
  { value: "choco", label: "Choc Latte", swatches: ["#e9c99b", "#eda45f", "#7a4520"] },
  { value: "maple", label: "Maple Gold", swatches: ["#efbf38", "#e08600", "#763a12"] },
] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("contact");
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [hours, setHours] = useState<AdminHours[]>([]);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="grid gap-6 [&>*]:min-w-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage contact info, kitchen ordering status, trading hours, and theme
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-9 w-full sm:col-span-2" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !site) {
    return (
      <div className="grid gap-6 [&>*]:min-w-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage contact info, kitchen ordering status, trading hours, and theme
          </p>
        </div>
        <AdminError message={error} onRetry={load} />
      </div>
    );
  }

  if (!site) return null;

  const setS = (key: keyof AdminSiteSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setSite((s) => (s ? { ...s, [key]: e.target.value } : s));

  const TABS = [
    {
      id: "contact",
      label: "Business & Contact",
      icon: Building2,
      desc: "Address, phone, WhatsApp & map",
    },
    {
      id: "kitchen",
      label: "Kitchen & Ordering",
      icon: UtensilsCrossed,
      desc: site.online_ordering_enabled ? "Active — Taking orders" : "Paused — Checkout disabled",
      badge: site.online_ordering_enabled ? "Active" : "Paused",
    },
    {
      id: "hours",
      label: "Trading Hours",
      icon: Clock,
      desc: `${hours.length} schedule rows`,
    },
    {
      id: "theme",
      label: "Colors & Theme",
      icon: Palette,
      desc: "Website color palette & branding",
    },
  ] as const;

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Business Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant location, takeaway ordering switch, operating hours, and appearance
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground p-2 rounded-lg border bg-background"
        >
          <span>View Live Website</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Modern Segmented Tab Control */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/80">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex flex-col items-start p-3 rounded-xl text-left transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-border font-semibold"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-500" : "text-muted-foreground"}`} />
                  <span className="text-sm">{tab.label}</span>
                </div>
                {"badge" in tab && tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      tab.badge === "Active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground line-clamp-1 font-normal">
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: CONTACT & BUSINESS ================= */}
      {activeTab === "contact" && (
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div>
              <CardTitle className="text-base font-bold">Business &amp; Contact Details</CardTitle>
              <CardDescription>
                Details shown on your website footer, receipts, and customer notification emails
              </CardDescription>
            </div>
            <Button
              size="sm"
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
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="s-address" className="text-xs font-semibold">Street Address</Label>
                <Input id="s-address" value={site.address} onChange={setS("address")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="s-phone" className="text-xs font-semibold">Phone Number</Label>
                <Input id="s-phone" value={site.phone} onChange={setS("phone")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="s-wa" className="text-xs font-semibold">WhatsApp Number (Optional)</Label>
                <Input id="s-wa" placeholder="+61 4xx xxx xxx" value={site.whatsapp} onChange={setS("whatsapp")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="s-email" className="text-xs font-semibold">Public &amp; Order Alert Email</Label>
                <Input id="s-email" type="email" value={site.email} onChange={setS("email")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="s-abn" className="text-xs font-semibold">ABN (Australian Business Number)</Label>
                <Input id="s-abn" value={site.abn} onChange={setS("abn")} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="s-tz" className="text-xs font-semibold">Venue Timezone</Label>
                <Select id="s-tz" className="h-9 text-xs" value={site.timezone} onChange={setS("timezone")}>
                  {AU_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="s-map" className="text-xs font-semibold">Google Maps Embed URL</Label>
                <Input id="s-map" value={site.map_embed} onChange={setS("map_embed")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="s-insta" className="text-xs font-semibold">Instagram Profile URL</Label>
                <Input id="s-insta" placeholder="https://instagram.com/…" value={site.instagram_url} onChange={setS("instagram_url")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="s-fb" className="text-xs font-semibold">Facebook Page URL</Label>
                <Input id="s-fb" placeholder="https://facebook.com/…" value={site.facebook_url} onChange={setS("facebook_url")} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="s-uber" className="text-xs font-semibold">Uber Eats Link</Label>
                <Input id="s-uber" placeholder="https://www.ubereats.com/..." value={site.uber_eats_url} onChange={setS("uber_eats_url")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 2: KITCHEN & ORDERING ================= */}
      {activeTab === "kitchen" && (
        <div className="grid gap-6 [&>*]:min-w-0">
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-bold">Kitchen &amp; Takeaway Online Ordering</CardTitle>
              <CardDescription>
                Instantly enable or pause online takeaway checkout when the kitchen is busy
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border bg-muted/20 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${site.online_ordering_enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    <span className="font-bold text-sm text-foreground">
                      {site.online_ordering_enabled ? "Online Ordering Active — Taking Orders" : "Online Ordering Paused — Checkout Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {site.online_ordering_enabled
                      ? "Checkout is open on the menu page. Flip the switch to pause instantly when busy."
                      : "Checkout is paused. Customers will see a friendly notice directing them to call or order via Uber Eats."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={site.online_ordering_enabled}
                    disabled={busy === "OrderingToggle"}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      setSite((s) => (s ? { ...s, online_ordering_enabled: nextVal } : s));
                      run(async () => {
                        await updateSiteSettings({ online_ordering_enabled: nextVal });
                      }, "OrderingToggle", { title: nextVal ? "Takeaway orders enabled" : "Takeaway orders paused" });
                    }}
                  />
                  <div className="w-12 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {!site.online_ordering_enabled && (
                <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Message Shown to Visitors While Ordering is Paused</span>
                  </div>
                  <Textarea
                    id="pause-msg"
                    rows={2}
                    value={site.online_ordering_disabled_message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setSite((s) => (s ? { ...s, online_ordering_disabled_message: e.target.value } : s))
                    }
                  />
                  <Button
                    size="sm"
                    className="text-xs"
                    loading={busy === "PauseMessage"}
                    onClick={() =>
                      run(async () => {
                        await updateSiteSettings({
                          online_ordering_disabled_message: site.online_ordering_disabled_message,
                        });
                      }, "PauseMessage", { title: "Pause notice saved" })
                    }
                  >
                    Save Notice Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Verification */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-bold">Email Notification Diagnostics</CardTitle>
              <CardDescription>
                Verify email connection to ensure booking confirmations and staff alerts are working properly
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Send Test Email</p>
                  <p className="text-xs text-muted-foreground">Dispatches a test message to {site.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  loading={busy === "TestEmail"}
                  onClick={() =>
                    run(async () => {
                      const res = await sendTestEmail();
                      if (!res.ok) throw new Error(res.detail);
                      toast({
                        variant: res.detail.includes("NOT") ? "info" : "success",
                        title: res.ok && !res.detail.includes("NOT") ? `Test email sent to ${res.to}` : "Email not configured yet",
                        description: res.detail,
                      });
                    }, "TestEmail")
                  }
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 3: OPENING HOURS ================= */}
      {activeTab === "hours" && (
        <Card className="shadow-xs border-border">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-bold">Restaurant Trading Hours</CardTitle>
            <CardDescription>
              Opening schedule displayed on the homepage and footer location board
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-3">
              {hours.map((h) => (
                <div key={h.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border bg-card shadow-2xs">
                  <Input
                    className="min-w-44 flex-1 h-9 text-xs"
                    placeholder="Day range (e.g. Monday – Thursday)"
                    value={h.label}
                    onChange={(e) => setHours((xs) => xs.map((x) => (x.id === h.id ? { ...x, label: e.target.value } : x)))}
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      className="w-28 h-9 text-xs"
                      value={h.opens.slice(0, 5)}
                      onChange={(e) => setHours((xs) => xs.map((x) => (x.id === h.id ? { ...x, opens: e.target.value } : x)))}
                    />
                    <span className="text-muted-foreground text-xs font-bold">–</span>
                    <Input
                      type="time"
                      className="w-28 h-9 text-xs"
                      value={h.closes.slice(0, 5)}
                      onChange={(e) => setHours((xs) => xs.map((x) => (x.id === h.id ? { ...x, closes: e.target.value } : x)))}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() =>
                      run(async () => {
                        await updateHours(h.id, { label: h.label, opens: h.opens, closes: h.closes });
                      }, "Hours", { title: "Hours saved" })
                    }
                  >
                    Save
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      run(async () => {
                        if (!confirm(`Delete “${h.label}”?`)) return;
                        await deleteHours(h.id);
                        setHours((xs) => xs.filter((x) => x.id !== h.id));
                      }, "Hours", { title: "Hours row deleted" })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add New Row */}
              <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-dashed bg-muted/20">
                <Input
                  className="min-w-44 flex-1 h-9 text-xs"
                  placeholder="New day range (e.g. Public Holidays)"
                  value={newRow.label}
                  onChange={(e) => setNewRow((n) => ({ ...n, label: e.target.value }))}
                />
                <div className="flex items-center gap-1.5">
                  <Input
                    type="time"
                    className="w-28 h-9 text-xs"
                    value={newRow.opens}
                    onChange={(e) => setNewRow((n) => ({ ...n, opens: e.target.value }))}
                  />
                  <span className="text-muted-foreground text-xs font-bold">–</span>
                  <Input
                    type="time"
                    className="w-28 h-9 text-xs"
                    value={newRow.closes}
                    onChange={(e) => setNewRow((n) => ({ ...n, closes: e.target.value }))}
                  />
                </div>
                <Button
                  size="sm"
                  className="h-9 text-xs"
                  disabled={!newRow.label.trim()}
                  onClick={() =>
                    run(async () => {
                      const created = await createHours({ ...newRow, sort_order: hours.length });
                      setHours((xs) => [...xs, created]);
                      setNewRow(EMPTY_ROW);
                    }, "Hours", { title: "Hours row added" })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 4: THEME & BRANDING ================= */}
      {activeTab === "theme" && (
        <Card className="shadow-xs border-border">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-bold">Website Color Palette &amp; Theme</CardTitle>
            <CardDescription>
              Choose a curated color theme preset or configure custom brand colors
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={site.theme === t.value}
                  onClick={() =>
                    run(
                      async () => {
                        await updateSiteSettings({ theme: t.value });
                        setSite((s) => (s ? { ...s, theme: t.value } : s));
                      },
                      "Theme",
                      {
                        title: `${t.label} theme applied`,
                        description: "Visible on public website now",
                      }
                    )
                  }
                  className={`relative rounded-xl border-2 p-3.5 text-left transition-all hover:scale-[1.01] ${
                    site.theme === t.value
                      ? "border-zinc-900 bg-muted/40 shadow-xs dark:border-zinc-100"
                      : "border-border hover:border-zinc-400 bg-card"
                  }`}
                >
                  <div className="mb-2.5 flex gap-1.5">
                    {t.swatches.map((c) => (
                      <span
                        key={c}
                        className="h-4 w-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-foreground">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {site.theme === t.value ? "✓ Active preset" : "Click to apply"}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Palette */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                site.theme === "custom" ? "border-zinc-900 bg-muted/20" : "border-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="grid gap-1">
                    <Label htmlFor="c-primary" className="text-xs font-semibold">Custom Primary Color</Label>
                    <Input
                      id="c-primary"
                      type="color"
                      className="h-9 w-16 p-0.5 cursor-pointer"
                      value={site.custom_primary}
                      onChange={setS("custom_primary")}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="c-accent" className="text-xs font-semibold">Custom Accent Color</Label>
                    <Input
                      id="c-accent"
                      type="color"
                      className="h-9 w-16 p-0.5 cursor-pointer"
                      value={site.custom_accent}
                      onChange={setS("custom_accent")}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="text-xs"
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
                      {
                        title: "Custom theme applied",
                      }
                    )
                  }
                >
                  Apply Custom Colors
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
