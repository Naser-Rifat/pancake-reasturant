import type { Dispatch, SetStateAction } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import { THEMES, type RunSave, type SetSiteField } from "../_lib";

// Settings · Theme tab: preset palette cards, live sample, custom hex override.
export function ThemeTab({
  site,
  setS,
  setSite,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  setSite: Dispatch<SetStateAction<AdminSiteSettings | null>>;
  busy: string;
  run: RunSave;
}) {
  return (
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
          <div className="p-5 rounded-lg border border-zinc-200 bg-white space-y-3">
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
            : "border-zinc-200 bg-white"
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
  );
}
