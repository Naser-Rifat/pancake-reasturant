import type { MetadataRoute } from "next";

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thepancakeclub.com.au"
).replace(/\/$/, "");

// AI/answer-engine crawlers we explicitly welcome, so the restaurant shows up
// in ChatGPT, Claude, Perplexity and Google's AI answers (GEO).
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/preview"] },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/admin", "/preview"] })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
