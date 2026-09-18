/**
 * Central utility for generating human-readable order and booking reference IDs.
 *
 * Formats match customer emails (backend/core/emails.py), printable receipts,
 * WhatsApp notifications, and pickup counter calls:
 * - Orders:   "TPC-XXXXXX"    (e.g. "TPC-345678")
 * - Bookings: "TPC-BK-XXXXXX" (e.g. "TPC-BK-345678")
 *
 * Where XXXXXX is the last 6 hexadecimal characters of the UUID, uppercase.
 */

/**
 * Formats a public UUID into the customer-facing Order Reference (e.g. "TPC-A1B2C3").
 */
export function formatOrderRef(publicId: string | null | undefined): string {
  if (!publicId) return "";
  const clean = publicId.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 6) return clean.toUpperCase();
  return `TPC-${clean.slice(-6).toUpperCase()}`;
}

/**
 * Formats a public UUID into the customer-facing Booking Reference (e.g. "TPC-BK-A1B2C3").
 */
export function formatBookingRef(publicId: string | null | undefined): string {
  if (!publicId) return "";
  const clean = publicId.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 6) return clean.toUpperCase();
  return `TPC-BK-${clean.slice(-6).toUpperCase()}`;
}

/**
 * Checks if an input search term matches an order's reference or UUID.
 * Supports: "TPC-A1B2C3", "#TPC-A1B2C3", "A1B2C3", or raw UUID.
 */
export function matchesOrderRef(publicId: string, query: string): boolean {
  if (!publicId || !query) return false;
  const q = query.trim().toLowerCase();
  const ref = formatOrderRef(publicId).toLowerCase();
  const rawId = publicId.toLowerCase();
  const cleanRawId = rawId.replace(/[^a-z0-9]/g, "");
  const cleanQ = q.replace(/^#/, "").replace(/^tpc-?/i, "").replace(/[^a-z0-9]/g, "");

  if (ref.includes(q)) return true;
  if (`#${ref}`.includes(q)) return true;
  if (rawId.includes(q)) return true;
  if (cleanQ.length >= 3 && cleanRawId.endsWith(cleanQ)) return true;
  return false;
}

/**
 * Checks if an input search term matches a booking's reference or UUID.
 * Supports: "TPC-BK-A1B2C3", "#TPC-BK-A1B2C3", "A1B2C3", or raw UUID.
 */
export function matchesBookingRef(publicId: string, query: string): boolean {
  if (!publicId || !query) return false;
  const q = query.trim().toLowerCase();
  const ref = formatBookingRef(publicId).toLowerCase();
  const rawId = publicId.toLowerCase();
  const cleanRawId = rawId.replace(/[^a-z0-9]/g, "");
  const cleanQ = q.replace(/^#/, "").replace(/^tpc-?bk-?/i, "").replace(/[^a-z0-9]/g, "");

  if (ref.includes(q)) return true;
  if (`#${ref}`.includes(q)) return true;
  if (rawId.includes(q)) return true;
  if (cleanQ.length >= 3 && cleanRawId.endsWith(cleanQ)) return true;
  return false;
}
