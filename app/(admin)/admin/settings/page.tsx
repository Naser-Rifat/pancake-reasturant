"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createHours,
  deleteHours,
  getSiteSettings,
  listHoursAdmin,
  updateHours,
  updateSiteSettings,
  type AdminHours,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast, type ToastInput } from "@/components/ui/toast";

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
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [hours, setHours] = useState<AdminHours[]>([]);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getSiteSettings(), listHoursAdmin()])
      .then(([s, h]) => {
        setSite(s);
        setHours(h);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

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

  if (!site) return error ? <p className="text-sm font-medium text-destructive">{error}</p> : null;

  const setS = (key: keyof AdminSiteSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setSite((s) => (s ? { ...s, [key]: e.target.value } : s));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Business details shown on the website and in customer emails
          </p>
        </div>
      </div>

      {/* ---------- contact & business ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; business</CardTitle>
          <CardDescription>Used on the site, in the footer, and in every customer email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="s-address">Address</Label>
              <Input id="s-address" value={site.address} onChange={setS("address")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-phone">Phone</Label>
              <Input id="s-phone" value={site.phone} onChange={setS("phone")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-wa">WhatsApp number (blank = hide the chat button)</Label>
              <Input id="s-wa" placeholder="+61 4xx xxx xxx" value={site.whatsapp} onChange={setS("whatsapp")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" type="email" value={site.email} onChange={setS("email")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-abn">ABN (shown on order emails)</Label>
              <Input id="s-abn" value={site.abn} onChange={setS("abn")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-tz">Restaurant timezone</Label>
              <Select id="s-tz" className="h-9" value={site.timezone} onChange={setS("timezone")}>
                {AU_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="s-map">Google Maps embed URL</Label>
              <Input id="s-map" value={site.map_embed} onChange={setS("map_embed")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-insta">Instagram URL</Label>
              <Input id="s-insta" placeholder="https://instagram.com/…" value={site.instagram_url} onChange={setS("instagram_url")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-fb">Facebook URL</Label>
              <Input id="s-fb" placeholder="https://facebook.com/…" value={site.facebook_url} onChange={setS("facebook_url")} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="s-uber">Uber Eats Store Link</Label>
              <Input id="s-uber" placeholder="https://www.ubereats.com/..." value={site.uber_eats_url} onChange={setS("uber_eats_url")} />
            </div>
          </div>
          <Button
            className="mt-4"
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
              }, "Settings")
            }
          >
            Save contact details
          </Button>
        </CardContent>
      </Card>

      {/* ---------- online ordering & kitchen control ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Kitchen &amp; Takeaway Online Ordering</CardTitle>
          <CardDescription>
            Control whether customers can place online takeaway orders from the website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-sm">Online Takeaway Ordering</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {site.online_ordering_enabled
                  ? "🟢 Taking orders — checkout is active on the menu page"
                  : "🔴 Paused — customers will see a message and phone/Uber Eats alternatives"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={site.online_ordering_enabled}
                onChange={(e) =>
                  setSite((s) => (s ? { ...s, online_ordering_enabled: e.target.checked } : s))
                }
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="s-pause-msg">Pause message shown to customers</Label>
            <Input
              id="s-pause-msg"
              placeholder="Online ordering is temporarily paused. Please visit us or call to place an order."
              value={site.online_ordering_disabled_message}
              onChange={setS("online_ordering_disabled_message")}
            />
          </div>

          <Button
            loading={busy === "OrderingControl"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  online_ordering_enabled: site.online_ordering_enabled,
                  online_ordering_disabled_message: site.online_ordering_disabled_message,
                });
              }, "OrderingControl")
            }
          >
            Save ordering status
          </Button>
        </CardContent>
      </Card>

      {/* ---------- website theme ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Website theme</CardTitle>
          <CardDescription>
            Colour palette for the public website — click to apply (visitors see it on their next page load)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                      description: "Visitors see it on their next page load",
                      action: { label: "View site", href: "/" },
                    }
                  )
                }
                className={`rounded-lg border-2 p-3 text-left transition ${
                  site.theme === t.value
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-border hover:border-zinc-400"
                }`}
              >
                <div className="mb-2 flex gap-1.5">
                  {t.swatches.map((c) => (
                    <span
                      key={c}
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-xs text-muted-foreground">
                  {site.theme === t.value ? "Active" : " "}
                </div>
              </button>
            ))}
          </div>
          <div
            className={`mt-3 rounded-lg border-2 p-3 ${
              site.theme === "custom" ? "border-zinc-900 bg-zinc-50" : "border-border"
            }`}
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="c-primary">Custom — main colour</Label>
                <Input
                  id="c-primary"
                  type="color"
                  className="h-10 w-16 p-1"
                  value={site.custom_primary}
                  onChange={setS("custom_primary")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-accent">Button colour</Label>
                <Input
                  id="c-accent"
                  type="color"
                  className="h-10 w-16 p-1"
                  value={site.custom_accent}
                  onChange={setS("custom_accent")}
                />
              </div>
              <Button
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
                      description: "Shades derived — readability auto-checked",
                      action: { label: "View site", href: "/" },
                    }
                  )
                }
              >
                Apply custom
              </Button>
              <span className="text-xs text-muted-foreground">
                {site.theme === "custom"
                  ? "Active — shades & readability are auto-adjusted"
                  : "Pick any two colours — we derive the rest and keep text readable"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- opening hours ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Opening hours</CardTitle>
          <CardDescription>Shown on the home page — one row per day range</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {hours.map((h) => (
            <div key={h.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
              <Input
                className="min-w-44 flex-1"
                value={h.label}
                onChange={(e) => setHours((xs) => xs.map((x) => (x.id === h.id ? { ...x, label: e.target.value } : x)))}
              />
              <Input
                type="time"
                className="w-32"
                value={h.opens.slice(0, 5)}
                onChange={(e) => setHours((xs) => xs.map((x) => (x.id === h.id ? { ...x, opens: e.target.value } : x)))}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                className="w-32"
                value={h.closes.slice(0, 5)}
                onChange={(e) => setHours((xs) => xs.map((x) => (x.id === h.id ? { ...x, closes: e.target.value } : x)))}
              />
              <Button size="sm" variant="outline" onClick={() =>
                run(async () => {
                  await updateHours(h.id, { label: h.label, opens: h.opens, closes: h.closes });
                }, "Hours", { title: "Opening hours saved" })
              }>
                Save
              </Button>
              <Button size="icon" variant="ghost" aria-label={`Delete ${h.label}`} onClick={() =>
                run(async () => {
                  if (!confirm(`Delete “${h.label}”?`)) return;
                  await deleteHours(h.id);
                  setHours((xs) => xs.filter((x) => x.id !== h.id));
                }, "Hours", { title: "Opening-hours row deleted" })
              }>
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
            <Input className="min-w-44 flex-1" placeholder="e.g. Monday – Thursday"
              value={newRow.label} onChange={(e) => setNewRow((n) => ({ ...n, label: e.target.value }))} />
            <Input type="time" className="w-32" value={newRow.opens}
              onChange={(e) => setNewRow((n) => ({ ...n, opens: e.target.value }))} />
            <span className="text-muted-foreground">–</span>
            <Input type="time" className="w-32" value={newRow.closes}
              onChange={(e) => setNewRow((n) => ({ ...n, closes: e.target.value }))} />
            <Button size="sm" disabled={!newRow.label.trim()} onClick={() =>
              run(async () => {
                const created = await createHours({ ...newRow, sort_order: hours.length });
                setHours((xs) => [...xs, created]);
                setNewRow(EMPTY_ROW);
              }, "Hours", { title: "Opening hours added" })
            }>
              <Plus /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
