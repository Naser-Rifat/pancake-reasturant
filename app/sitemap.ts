import type { MetadataRoute } from "next";
import { API_URL, type ApiMenuItem } from "@/lib/api";
import { FALLBACK_MENU } from "@/lib/fallback-data";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thepancakeclub.com.au"
).replace(/\/$/, "");

// Keep Google's fetch independent from a momentary backend slowdown. Next
// serves the cached XML immediately and refreshes the menu list once an hour.
export const revalidate = 3600;

async function getSitemapMenu(): Promise<ApiMenuItem[]> {
  try {
    const response = await fetch(`${API_URL}/menu/`, {
      next: { revalidate },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return FALLBACK_MENU;
    return (await response.json()) as ApiMenuItem[];
  } catch {
    return FALLBACK_MENU;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/menu`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/booking`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/gallery`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/join-our-club`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // One entry per dish so search engines index every menu page.
  const menu = await getSitemapMenu();
  const dishPages: MetadataRoute.Sitemap = menu.map((item) => ({
    url: `${BASE}/menu/${item.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...dishPages];
}
