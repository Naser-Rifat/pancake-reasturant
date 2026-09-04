// Pure types, constants and helpers for the admin settings page. Extracted from
// page.tsx to keep that component focused on state + tab orchestration.
import type { ChangeEvent } from "react";
import type { AdminSiteSettings } from "@/lib/admin-api";
import type { ToastInput } from "@/components/ui/toast";

export type SettingsTab = "contact" | "kitchen" | "hours" | "theme";

/** Curried onChange handler for a single AdminSiteSettings field (input/select/textarea). */
export type SetSiteField = (
  key: keyof AdminSiteSettings,
) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

/** Runs a save action with busy state + success/error toasts (from the settings page). */
export type RunSave = (fn: () => Promise<void>, what: string, success?: ToastInput) => Promise<void>;

export type HoursRow = { label: string; opens: string; closes: string };

export const AU_TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Australia/Hobart",
  "Australia/Darwin",
];

export const EMPTY_ROW: HoursRow = { label: "", opens: "09:00", closes: "17:00" };

export const THEMES = [
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

/** 24h "13:30" → friendly "1:30 PM". */
export function formatTime12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr || "00"} ${ampm}`;
}
