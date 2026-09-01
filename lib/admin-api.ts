// Client for the staff-only admin API. Token is kept in localStorage and sent
// as an Authorization header; any 401/403 clears it and bounces to the login page.

import { API_URL } from "./api";

const TOKEN_KEY = "krush-admin-token";

export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export interface AdminOrder {
  public_id: string;
  customer_name: string;
  email: string;
  phone: string;
  notes: string;
  status: "received" | "preparing" | "ready" | "completed" | "cancelled";
  cancel_reason: string;
  total: string;
  created_at: string;
  items: { slug: string; name: string; quantity: number; unit_price: string; line_total: string }[];
}

export interface AdminBooking {
  public_id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  party_size: number;
  preselected_dish?: string;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export interface AdminReview {
  id: number;
  name: string;
  suburb: string;
  rating: number;
  quote: string;
  avatar: string;
  is_approved: boolean;
  created_at: string;
}

export interface AdminMenuItem {
  slug: string;
  name: string;
  description: string;
  price: string;
  tag: "sweet" | "savoury" | "choc";
  heat: "none" | "medium" | "hot";
  kcal: number | null;
  protein_g: number | null;
  prep_time: string;
  image: string;
  photo: string;
  is_featured: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface AdminStats {
  orders_today: number;
  revenue_today: string;
  active_orders: number;
  pending_bookings: number;
  pending_reviews: number;
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 || res.status === 403) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const body = await res.json();
      msg = body.detail ?? JSON.stringify(body);
    } catch { /* non-JSON body */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Paginated DRF responses arrive as {results}; unpaginated as bare arrays. */
const unwrap = <T,>(data: { results: T[] } | T[]): T[] =>
  Array.isArray(data) ? data : data.results;

// ---------- auth ----------

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_URL}/admin/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? "Login failed.");
  setToken(body.token);
  return body as { token: string; username: string };
}

// ---------- reads ----------

export const getStats = () => adminFetch<AdminStats>("/stats/");

export const listOrders = async (status?: string) =>
  unwrap(await adminFetch<{ results: AdminOrder[] } | AdminOrder[]>(
    `/orders/${status ? `?status=${status}` : ""}`
  ));

export const listBookings = async (status?: string) =>
  unwrap(await adminFetch<{ results: AdminBooking[] } | AdminBooking[]>(
    `/bookings/${status ? `?status=${status}` : ""}`
  ));

export const listReviews = () => adminFetch<AdminReview[]>("/reviews/");

export const listMenu = () => adminFetch<AdminMenuItem[]>("/menu/");

// ---------- writes ----------

export const updateOrder = (publicId: string, patch: Partial<AdminOrder>) =>
  adminFetch<AdminOrder>(`/orders/${publicId}/`, { method: "PATCH", body: JSON.stringify(patch) });

export const updateBooking = (publicId: string, patch: Partial<AdminBooking>) =>
  adminFetch<AdminBooking>(`/bookings/${publicId}/`, { method: "PATCH", body: JSON.stringify(patch) });

export const updateReview = (id: number, patch: Partial<AdminReview>) =>
  adminFetch<AdminReview>(`/reviews/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });

export const deleteReview = (id: number) =>
  adminFetch<void>(`/reviews/${id}/`, { method: "DELETE" });

export const updateMenuItem = (slug: string, patch: Partial<AdminMenuItem>) =>
  adminFetch<AdminMenuItem>(`/menu/${slug}/`, { method: "PATCH", body: JSON.stringify(patch) });

export const createMenuItem = (data: Partial<AdminMenuItem>) =>
  adminFetch<AdminMenuItem>("/menu/", { method: "POST", body: JSON.stringify(data) });

export const deleteMenuItem = (slug: string) =>
  adminFetch<void>(`/menu/${slug}/`, { method: "DELETE" });

export const createAdminBooking = (data: Partial<AdminBooking>) =>
  adminFetch<AdminBooking>("/bookings/", { method: "POST", body: JSON.stringify(data) });

// ---------- site content & settings ----------

export interface AdminCertification {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  sort_order: number;
  is_active: boolean;
}

export interface AdminGalleryPhoto {
  id: number;
  album: "food" | "interior" | "events";
  caption: string;
  image: string;
  alt: string;
  sort_order: number;
  focus: "top" | "center" | "bottom";
}

export interface AdminAnnouncement {
  id: number;
  message: string;
  details: string;
  link_text: string;
  link_url: string;
  image: string;
  /** ISO datetimes; null = no limit on that end */
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface AdminHours {
  id: number;
  label: string;
  opens: string;
  closes: string;
  sort_order: number;
}

export interface AdminSiteSettings {
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
  about_points: string;
  cta_heading: string;
  cta_script: string;
  cta_lead: string;
  cta_button_label: string;
  cta_button_url: string;
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
  uber_eats_url: string;
  online_ordering_enabled: boolean;
  online_ordering_disabled_message: string;
  timezone: string;
  theme: string;
  custom_primary: string;
  custom_accent: string;
}

export interface AdminMenuItemPhoto {
  id: number;
  menu_item: string; // slug
  image: string;
  alt: string;
  sort_order: number;
}

export const listMenuItemPhotos = (slug: string) =>
  adminFetch<AdminMenuItemPhoto[]>(`/menu-photos/?menu_item=${encodeURIComponent(slug)}`);
export const createMenuItemPhoto = (d: Omit<AdminMenuItemPhoto, "id">) =>
  adminFetch<AdminMenuItemPhoto>("/menu-photos/", { method: "POST", body: JSON.stringify(d) });
export const deleteMenuItemPhoto = (id: number) =>
  adminFetch<void>(`/menu-photos/${id}/`, { method: "DELETE" });

export const getSiteSettings = () => adminFetch<AdminSiteSettings>("/site/");
export const updateSiteSettings = (patch: Partial<AdminSiteSettings>) =>
  adminFetch<AdminSiteSettings>("/site/", { method: "PATCH", body: JSON.stringify(patch) });

export const listCertifications = () => adminFetch<AdminCertification[]>("/certifications/");
export const createCertification = (d: Partial<AdminCertification>) =>
  adminFetch<AdminCertification>("/certifications/", { method: "POST", body: JSON.stringify(d) });
export const updateCertification = (id: number, d: Partial<AdminCertification>) =>
  adminFetch<AdminCertification>(`/certifications/${id}/`, { method: "PATCH", body: JSON.stringify(d) });
export const deleteCertification = (id: number) =>
  adminFetch<void>(`/certifications/${id}/`, { method: "DELETE" });

export interface AdminHomeStep {
  id: number;
  label: string;
  title: string;
  text: string;
  image: string;
  sort_order: number;
}

export const listHomeSteps = () => adminFetch<AdminHomeStep[]>("/home-steps/");
export const createHomeStep = (d: Partial<AdminHomeStep>) =>
  adminFetch<AdminHomeStep>("/home-steps/", { method: "POST", body: JSON.stringify(d) });
export const updateHomeStep = (id: number, d: Partial<AdminHomeStep>) =>
  adminFetch<AdminHomeStep>(`/home-steps/${id}/`, { method: "PATCH", body: JSON.stringify(d) });
export const deleteHomeStep = (id: number) =>
  adminFetch<void>(`/home-steps/${id}/`, { method: "DELETE" });

export const listGalleryAdmin = () => adminFetch<AdminGalleryPhoto[]>("/gallery/");
export const createGalleryPhoto = (d: Partial<AdminGalleryPhoto>) =>
  adminFetch<AdminGalleryPhoto>("/gallery/", { method: "POST", body: JSON.stringify(d) });
export const updateGalleryPhoto = (id: number, d: Partial<AdminGalleryPhoto>) =>
  adminFetch<AdminGalleryPhoto>(`/gallery/${id}/`, { method: "PATCH", body: JSON.stringify(d) });
export const deleteGalleryPhoto = (id: number) =>
  adminFetch<void>(`/gallery/${id}/`, { method: "DELETE" });

export const listAnnouncements = () => adminFetch<AdminAnnouncement[]>("/announcements/");
export const deleteAnnouncement = (id: number) =>
  adminFetch<void>(`/announcements/${id}/`, { method: "DELETE" });
export const createAnnouncement = (d: Partial<AdminAnnouncement>) =>
  adminFetch<AdminAnnouncement>("/announcements/", { method: "POST", body: JSON.stringify(d) });
export const updateAnnouncement = (id: number, d: Partial<AdminAnnouncement>) =>
  adminFetch<AdminAnnouncement>(`/announcements/${id}/`, { method: "PATCH", body: JSON.stringify(d) });

export const listHoursAdmin = () => adminFetch<AdminHours[]>("/hours/");
export const createHours = (d: Partial<AdminHours>) =>
  adminFetch<AdminHours>("/hours/", { method: "POST", body: JSON.stringify(d) });
export const updateHours = (id: number, d: Partial<AdminHours>) =>
  adminFetch<AdminHours>(`/hours/${id}/`, { method: "PATCH", body: JSON.stringify(d) });
export const deleteHours = (id: number) =>
  adminFetch<void>(`/hours/${id}/`, { method: "DELETE" });
