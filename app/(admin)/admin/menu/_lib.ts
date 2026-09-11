// Constants, types and helpers for the admin menu catalog page.
import type { AdminCategory, AdminMenuItem } from "@/lib/admin-api";

export const TAG_INFO: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  sweet: {
    label: "Sweet Stack",
    icon: "🍯",
    bg: "bg-amber-100/80",
    text: "text-amber-950",
    border: "border-amber-300",
  },
  savoury: {
    label: "Savoury Brunch",
    icon: "🥑",
    bg: "bg-orange-100/80",
    text: "text-orange-950",
    border: "border-orange-300",
  },
  choc: {
    label: "Choc Loaded",
    icon: "🍫",
    bg: "bg-[#f4e6dc]",
    text: "text-[#522b14]",
    border: "border-[#d8b8a2]",
  },
};

export function getCategoryBadge(
  item: AdminMenuItem,
  categoriesMap?: Map<string, AdminCategory>
): { label: string; icon: string; bg: string; text: string; border: string } {
  if (item.category_slug && categoriesMap?.has(item.category_slug)) {
    const cat = categoriesMap.get(item.category_slug)!;
    return {
      label: cat.name,
      icon: cat.icon || "🥞",
      bg: "bg-amber-100/80",
      text: "text-amber-950",
      border: "border-amber-300",
    };
  }
  const known = TAG_INFO[item.tag] || (item.category_slug ? TAG_INFO[item.category_slug] : undefined);
  if (known) return known;
  return {
    label: item.category_name || item.tag,
    icon: item.category_icon || "🥞",
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
  };
}

export const EMPTY_FORM = {
  slug: "",
  name: "",
  description: "",
  price: "",
  tag: "sweet",
  category: undefined as number | undefined,
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

export type FilterCategory = string;

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

