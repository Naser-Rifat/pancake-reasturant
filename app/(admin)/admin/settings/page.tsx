"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  UtensilsCrossed,
  Clock,
  Palette,
  ExternalLink,
} from "lucide-react";
import {
  getSiteSettings,
  listHoursAdmin,
  type AdminHours,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast, type ToastInput } from "@/components/ui/toast";

import { ContactTab } from "./_components/ContactTab";
import { KitchenTab } from "./_components/KitchenTab";
import { HoursTab } from "./_components/HoursTab";
import { ThemeTab } from "./_components/ThemeTab";
import { EMPTY_ROW, type SettingsTab } from "./_lib";

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
        <ContactTab site={site} setS={setS} setSite={setSite} busy={busy} run={run} />
      )}

      {activeTab === "kitchen" && (
        <KitchenTab site={site} setSite={setSite} busy={busy} setBusy={setBusy} run={run} />
      )}

      {activeTab === "hours" && (
        <HoursTab hours={hours} setHours={setHours} newRow={newRow} setNewRow={setNewRow} busy={busy} run={run} />
      )}

      {activeTab === "theme" && (
        <ThemeTab site={site} setS={setS} setSite={setSite} busy={busy} run={run} />
      )}
    </div>
  );
}
