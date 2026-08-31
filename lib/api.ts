// Typed client for the Django REST backend.
// Server components use the read helpers (with graceful fallbacks so the
// storefront renders even when the API is down); client components use the
// POST helpers, which surface backend validation errors.
const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");
export const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

export interface ApiMenuItem {
  slug: string;
  name: string;
  description: string;
  price: string; // decimal string, e.g. "17.00"
  tag: "sweet" | "savoury" | "choc";
  heat: "none" | "medium" | "hot";
  kcal: number | null;
  protein_g: number | null;
  prep_time: string;
  /** transparent cutout — tiles, thumbs, hero blob */
  image: string;
  /** original photo — framed cards; falls back to `image` when empty */
  photo: string;
  /** extra real-life shots — the polaroid fan on the dish page */
  photos: { id: number; image: string; alt: string; sort_order: number }[];
  is_featured: boolean;
}

export interface ApiReview {
  name: string;
  suburb: string;
  rating: number;
  quote: string;
  avatar: string;
}

export interface ApiGalleryPhoto {
  album: "food" | "interior" | "events";
  caption: string;
  image: string;
  alt: string;
  /** which part of the photo survives the grid's crop */
  focus: "top" | "center" | "bottom";
}

export interface ApiAnnouncement {
  message: string;
  /** the offer's conditions, one or two lines */
  details: string;
  link_text: string;
  link_url: string;
  image: string;
  /** ISO datetime; null = runs until switched off */
  ends_at: string | null;
}

/** "Ends today!" / "Ends tomorrow" / "Ends Sunday" — urgency copy for a promo. */
export function endsLabel(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  const days = Math.floor((end.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "Ends today!";
  if (days === 1) return "Ends tomorrow";
  if (days < 7) return `Ends ${end.toLocaleDateString("en-AU", { weekday: "long" })}`;
  return `Until ${end.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`;
}

/** Splits a campaign's end date into the two lines the circular badge shows.
 *  Falls back to "ON / now" so an open-ended campaign still fills the badge. */
export function countdownBadge(endsAt: string | null): { big: string; small: string } {
  if (!endsAt) return { big: "ON", small: "now" };
  const days = Math.floor((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { big: "ON", small: "now" };
  if (days === 0) return { big: "TODAY", small: "last chance" };
  if (days === 1) return { big: "1 DAY", small: "left to claim" };
  return { big: `${days} DAYS`, small: "left to claim" };
}

export interface ApiOpeningHours {
  label: string;
  opens: string; // "11:00:00"
  closes: string;
}

export interface ApiCertification {
  icon: string;
  title: string;
  subtitle: string;
}

export interface ApiSiteSettings {
  hero_heading: string;
  hero_script: string;
  hero_lead: string;
  hero_image: string;
  hero_cutout: string;
  about_text: string;
  about_heading: string;
  about_script: string;
  about_image_1: string;
  about_image_2: string;
  about_image_3: string;
  /** one tick per line */
  about_points: string;
  cta_heading: string;
  cta_script: string;
  cta_lead: string;
  cta_button_label: string;
  cta_button_url: string;
  /** one phrase per line */
  marquee_words: string;
  footer_tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  abn: string;
  map_embed: string;
  instagram_url: string;
  facebook_url: string;
  timezone: string;
  theme: string;
  custom_primary: string;
  custom_accent: string;
}

export interface ApiOrder {
  public_id: string;
  status: string;
  total: string;
  items: { slug: string; name: string; quantity: number; unit_price: string; line_total: string }[];
}

export interface ApiBooking {
  public_id: string;
  status: string;
  date: string;
  time: string;
  party_size: number;
}

// ---------- display helpers ----------

export const TAG_LABEL: Record<ApiMenuItem["tag"], string> = {
  sweet: "Sweet",
  savoury: "Savoury",
  choc: "Choc Loaded",
};

export const heatClass = (heat: ApiMenuItem["heat"]) => (heat === "none" ? "" : heat);

export const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

/** "(02) 5550 1234" -> "tel:0255501234" */
export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/** "21:30:00" -> "9:30pm" */
/** One price format for the whole site. Whole dollars stay whole. */
export function money(price: string | number) {
  const v = typeof price === "number" ? price : parseFloat(price);
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

// ---------- server-side reads (fallback on failure) ----------

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

/** Menu + a liveness flag so the storefront can pause ordering when the API is down. */
export async function getMenuWithStatus(): Promise<{ items: ApiMenuItem[]; live: boolean }> {
  const { FALLBACK_MENU } = await import("./fallback-data");
  try {
    const res = await fetch(`${API_URL}/menu/`, { cache: "no-store" });
    if (!res.ok) return { items: FALLBACK_MENU, live: false };
    return { items: (await res.json()) as ApiMenuItem[], live: true };
  } catch {
    return { items: FALLBACK_MENU, live: false };
  }
}

export async function getFeaturedMenu(): Promise<ApiMenuItem[]> {
  const { FALLBACK_MENU } = await import("./fallback-data");
  return get("/menu/?featured=1", FALLBACK_MENU.filter((m) => m.is_featured));
}

export async function getReviews(): Promise<ApiReview[]> {
  const { FALLBACK_REVIEWS } = await import("./fallback-data");
  const data = await get<{ results: ApiReview[] } | null>("/reviews/", null);
  return data?.results ?? FALLBACK_REVIEWS;
}

export async function getGallery(): Promise<ApiGalleryPhoto[]> {
  const { FALLBACK_GALLERY } = await import("./fallback-data");
  return get("/gallery/", FALLBACK_GALLERY);
}

export async function getHours(): Promise<ApiOpeningHours[]> {
  const { FALLBACK_HOURS } = await import("./fallback-data");
  return get("/hours/", FALLBACK_HOURS);
}

export async function getCertifications(): Promise<ApiCertification[]> {
  const { FALLBACK_CERTS } = await import("./fallback-data");
  return get("/certifications/", FALLBACK_CERTS);
}

export interface ApiHomeStep {
  id: number;
  label: string;
  title: string;
  text: string;
  image: string;
  sort_order: number;
}

export async function getCampaigns(): Promise<ApiAnnouncement[]> {
  return get("/campaigns/", [] as ApiAnnouncement[]);
}

export async function getHomeSteps(): Promise<ApiHomeStep[]> {
  const { FALLBACK_HOME_STEPS } = await import("./fallback-data");
  return get("/home-steps/", FALLBACK_HOME_STEPS);
}

/** Splits a one-per-line settings field, dropping blank lines. */
export function lines(value: string): string[] {
  return (value || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

export async function getSite(): Promise<ApiSiteSettings> {
  const { FALLBACK_SITE } = await import("./fallback-data");
  return get("/site/", FALLBACK_SITE);
}

export async function getAnnouncement(): Promise<ApiAnnouncement | null> {
  // No fallback here on purpose: better to show no promo than a stale one
  // the restaurant may have already ended.
  try {
    const res = await fetch(`${API_URL}/announcement/`, { cache: "no-store" });
    if (!res.ok) return null; // includes 204 = deliberately no announcement
    return (await res.json()) as ApiAnnouncement;
  } catch {
    return null;
  }
}

// ---------- client-side writes ----------

function firstError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  for (const value of Object.values(body as Record<string, unknown>)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    const nested = firstError(value);
    if (nested) return nested;
  }
  return null;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Can't reach the kitchen right now — please try again or call us.");
  }
  if (!res.ok) {
    let detail: string | null = null;
    try {
      detail = firstError(await res.json());
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail ?? "Something went wrong — please try again.");
  }
  return (await res.json()) as T;
}

export function placeOrder(payload: {
  customer_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  items: { slug: string; quantity: number }[];
}): Promise<ApiOrder> {
  return post("/orders/", payload);
}

export function submitReview(payload: {
  name: string;
  suburb?: string;
  rating: number;
  quote: string;
}): Promise<unknown> {
  return post("/reviews/", payload);
}

export function createBooking(payload: {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  party_size: number;
  notes?: string;
}): Promise<ApiBooking> {
  return post("/bookings/", payload);
}
