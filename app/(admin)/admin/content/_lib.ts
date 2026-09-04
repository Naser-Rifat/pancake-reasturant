// Pure types, constants and helpers for the admin content studio. Extracted
// from page.tsx to keep that component focused on rendering + state.
import type { ChangeEvent } from "react";
import type { AdminAnnouncement, AdminGalleryPhoto, AdminSiteSettings } from "@/lib/admin-api";
import type { ToastInput } from "@/components/ui/toast";

/** Curried onChange handler for a single AdminSiteSettings text field. */
export type SetSiteField = (
  key: keyof AdminSiteSettings,
) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

/** Runs a save action with busy state + success/error toasts (from the studio). */
export type RunSave = (fn: () => Promise<void>, what: string, success?: ToastInput) => Promise<void>;

export type PageTab = "home" | "menu" | "gallery" | "booking";
export type ViewportMode = "desktop" | "mobile";
export type CampaignFormat = "band" | "slider";
export type DealCadence = "all" | "weekly" | "monthly" | "regular";

export type NewPhoto = Pick<AdminGalleryPhoto, "album" | "caption" | "image" | "alt">;

export const EMPTY_PHOTO: NewPhoto = {
  album: "food",
  caption: "",
  image: "",
  alt: "",
};
export const EMPTY_CERT = { icon: "medal", image: "", title: "", subtitle: "" };

/** ISO datetime ↔ <input type="datetime-local"> value (local wall-clock) */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

export function getDealCadence(a: AdminAnnouncement): "weekly" | "monthly" | "regular" {
  const t = `${a.message} ${a.details}`.toLowerCase();
  if (t.includes("month") || t.includes("monthly") || t.includes("30 day") || t.includes("september") || t.includes("october")) {
    return "monthly";
  }
  if (t.includes("week") || t.includes("weekend") || t.includes("brunch pass") || t.includes("tuesday") || t.includes("sunday")) {
    return "weekly";
  }
  return "regular";
}
