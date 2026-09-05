import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Serialise an object for a JSON-LD <script> tag. JSON.stringify alone does not
 * escape "<", so a value containing "</script>" would break out of the tag and
 * inject markup — escape the HTML-significant characters to close that hole.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * Only let an https:// URL through to an iframe/link src. The map embed is set
 * in the admin panel, but an unchecked value could carry a "javascript:" or
 * "data:" scheme, so anything that is not plain https is dropped.
 */
export function safeEmbedUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sanitise an admin-entered link before using it as an href. Relative paths and
 * in-page anchors pass through, as do http(s)/tel/mailto absolute links; anything
 * else (e.g. a "javascript:" scheme) is replaced with `fallback`, so a stored
 * value can never run script when a visitor clicks it.
 */
export function safeHref(url: string | null | undefined, fallback = "/"): string {
  const trimmed = url?.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const { protocol } = new URL(trimmed);
    return ["http:", "https:", "tel:", "mailto:"].includes(protocol) ? trimmed : fallback;
  } catch {
    return fallback; // neither a valid absolute URL nor a relative path
  }
}
