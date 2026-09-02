// Helpers that turn the restaurant's data into schema.org structured data.
// Rich structured data is what wins Google rich results (star ratings, hours)
// and what generative engines (ChatGPT, Perplexity) quote as facts.

import type { ApiOpeningHours, ApiReview } from "./api";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Turn freeform hour labels ("Monday – Thursday", "Sunday") into schema.org
 * OpeningHoursSpecification entries. Labels that aren't day names (e.g.
 * "Public Holidays") are skipped rather than guessed at.
 */
export function openingHoursSpec(hours: ApiOpeningHours[]) {
  const spec: {
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[] = [];

  for (const h of hours) {
    const parts = h.label.split(/\s*[–—-]\s*/).map((s) => s.trim());
    const startIdx = DAYS.indexOf(parts[0]);
    if (startIdx === -1) continue; // not a day name — skip
    const endIdx = parts[1] ? DAYS.indexOf(parts[1]) : startIdx;
    if (endIdx === -1) continue;

    const days: string[] = [];
    for (let i = startIdx; ; i = (i + 1) % 7) {
      days.push(`https://schema.org/${DAYS[i]}`);
      if (i === endIdx || days.length > 7) break;
    }

    spec.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: h.opens.slice(0, 5),
      closes: h.closes.slice(0, 5),
    });
  }
  return spec;
}

/** schema.org AggregateRating from the approved reviews, or null if none. */
export function aggregateRating(reviews: ApiReview[]) {
  const rated = reviews.filter((r) => r.rating > 0);
  if (!rated.length) return null;
  const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
  return {
    "@type": "AggregateRating" as const,
    ratingValue: avg.toFixed(1),
    reviewCount: rated.length,
    bestRating: 5,
    worstRating: 1,
  };
}
