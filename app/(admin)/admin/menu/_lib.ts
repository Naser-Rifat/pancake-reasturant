// Constants, types and helpers for the admin menu catalog page.
import type { AdminMenuItem } from "@/lib/admin-api";

export const TAG_INFO: Record<
  AdminMenuItem["tag"],
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  sweet: {
    label: "Sweet Stack",
    icon: "",
    bg: "bg-amber-100/80",
    text: "text-amber-950",
    border: "border-amber-300",
  },
  savoury: {
    label: "Savoury Brunch",
    icon: "",
    bg: "bg-orange-100/80",
    text: "text-orange-950",
    border: "border-orange-300",
  },
  choc: {
    label: "Choc Loaded",
    icon: "",
    bg: "bg-[#f4e6dc]",
    text: "text-[#522b14]",
    border: "border-[#d8b8a2]",
  },
};

export const EMPTY_FORM = {
  slug: "",
  name: "",
  description: "",
  price: "",
  tag: "sweet" as AdminMenuItem["tag"],
  heat: "none" as AdminMenuItem["heat"],
  kcal: "",
  protein_g: "",
  prep_time: "",
  image: "",
  photo: "",
  is_available: true,
  is_featured: false,
};

export type FormState = typeof EMPTY_FORM;

export type FilterCategory = "all" | "sweet" | "savoury" | "choc" | "featured" | "live";

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
