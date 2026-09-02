import type { MetadataRoute } from "next";
import { getMenu } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/menu`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/booking`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // One entry per dish so search engines index every menu page.
  let dishPages: MetadataRoute.Sitemap = [];
  try {
    const menu = await getMenu();
    dishPages = menu.map((item) => ({
      url: `${BASE}/menu/${item.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    /* API down — still return the static pages */
  }

  return [...staticPages, ...dishPages];
}
