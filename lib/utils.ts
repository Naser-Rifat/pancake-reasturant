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
