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
