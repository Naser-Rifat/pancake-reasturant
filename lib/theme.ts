/**
 * Custom Theme Derivation & Dynamic CSS Variable Generation
 *
 * Derives the complete client token palette from two user-selected colors (primary & accent).
 * Enforces strict WCAG 2.1 AA accessibility contrast standards so custom color choices
 * remain beautifully readable and compliant across surfaces, text, and backdrops.
 *
 * Runs server-side in the site root layout with O(1) in-memory memoization.
 */

import type { CSSProperties } from "react";

/** RGB Color model representation [0, 255] */
export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Strongly typed custom CSS variable tokens injected into document styles */
export interface CustomThemeVariables extends CSSProperties {
  "--yellow": string;
  "--yellow-deep": string;
  "--pink": string;
  "--pink-deep": string;
  "--berry": string;
  "--blush": string;
  [key: `--${string}`]: string | undefined;
}

// Fixed brand reference colors
const INK: RGB = Object.freeze({ r: 0x21, g: 0x1a, b: 0x14 }); // --ink (#211a14) fixed text color
const CREAM: RGB = Object.freeze({ r: 0xf8, g: 0xf2, b: 0xe0 }); // --cream (#f8f2e0) page background

// Pre-computed constant luminances (eliminates redundant loop recalculations)
const LUM_INK: number = relativeLuminance(INK);
const LUM_CREAM: number = relativeLuminance(CREAM);

// Lightweight in-memory LRU cache to ensure O(1) repeated layout renders
const THEME_CACHE = new Map<string, CustomThemeVariables>();
const MAX_CACHE_SIZE = 64;

/**
 * Parses a hex string (#RGB, #RRGGBB, RGB, RRGGBB) into an RGB object.
 * Returns null if the format is invalid.
 */
export function parseHexColor(rawHex: string): RGB | null {
  if (!rawHex || typeof rawHex !== "string") return null;
  const clean = rawHex.trim().replace(/^#/, "");

  // Support 3-character shorthand (#abc -> #aabbcc)
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }

  // Support standard 6-character hex
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const n = parseInt(clean, 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
    };
  }

  return null;
}

/** Clamps a number to valid 8-bit integer channel [0, 255] */
const clampByte = (val: number): number => Math.max(0, Math.min(255, Math.round(val)));

/** Converts an RGB object to a standard 6-character hex string (#rrggbb) */
export function rgbToHex({ r, g, b }: RGB): string {
  return (
    "#" +
    clampByte(r).toString(16).padStart(2, "0") +
    clampByte(g).toString(16).padStart(2, "0") +
    clampByte(b).toString(16).padStart(2, "0")
  );
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * Normalized value ranges from 0.0 (darkest black) to 1.0 (brightest white).
 */
export function relativeLuminance({ r, g, b }: RGB): number {
  const linearize = (channel: number): number => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculates the WCAG contrast ratio between two relative luminance values.
 * Returns a ratio between 1.0 and 21.0.
 */
export function contrastFromLuminance(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Calculates the WCAG contrast ratio between two RGB colors directly */
export function calculateContrastRatio(colorA: RGB, colorB: RGB): number {
  return contrastFromLuminance(relativeLuminance(colorA), relativeLuminance(colorB));
}

/** Linearly lightens an RGB color towards white (255, 255, 255) by a ratio [0, 1] */
export const lightenRgb = (c: RGB, factor: number): RGB => ({
  r: c.r + (255 - c.r) * factor,
  g: c.g + (255 - c.g) * factor,
  b: c.b + (255 - c.b) * factor,
});

/** Linearly darkens an RGB color towards black (0, 0, 0) by a ratio [0, 1] */
export const darkenRgb = (c: RGB, factor: number): RGB => ({
  r: c.r * (1 - factor),
  g: c.g * (1 - factor),
  b: c.b * (1 - factor),
});

/**
 * Surfaces carry --ink (#211a14) text.
 * Iteratively lightens the color until WCAG AA body-text contrast (>= 4.5:1) holds.
 */
function ensureSurfaceContrast(color: RGB): RGB {
  let current = color;
  for (let i = 0; i < 24; i++) {
    const lum = relativeLuminance(current);
    if (contrastFromLuminance(lum, LUM_INK) >= 4.5) break;
    current = lightenRgb(current, 0.08);
  }
  return current;
}

/**
 * Script accent is large display text.
 * Iteratively darkens the color until it achieves:
 * - >= 3.0:1 contrast against the custom surface
 * - >= 4.5:1 contrast against the cream background
 */
function ensureScriptContrast(color: RGB, surfaceColor: RGB): RGB {
  let current = color;
  const surfaceLum = relativeLuminance(surfaceColor);
  for (let i = 0; i < 24; i++) {
    const currentLum = relativeLuminance(current);
    const surfaceContrast = contrastFromLuminance(currentLum, surfaceLum);
    const creamContrast = contrastFromLuminance(currentLum, LUM_CREAM);
    if (surfaceContrast >= 3.0 && creamContrast >= 4.5) break;
    current = darkenRgb(current, 0.08);
  }
  return current;
}

/**
 * Derives the complete CSS custom properties token set for custom themes.
 * Returns null if any hex color is malformed, gracefully falling back to defaults.
 *
 * @param primaryHex Primary brand color in hex (e.g. "#f59e0b" or "f59e0b")
 * @param accentHex Accent brand color in hex (e.g. "#ec4899" or "ec4899")
 */
export function customThemeStyle(
  primaryHex: string,
  accentHex: string
): CustomThemeVariables | null {
  const p0 = parseHexColor(primaryHex);
  const a0 = parseHexColor(accentHex);
  if (!p0 || !a0) return null;

  // Cache key based on normalized RGB values
  const cacheKey = `${p0.r},${p0.g},${p0.b}:${a0.r},${a0.g},${a0.b}`;
  const cached = THEME_CACHE.get(cacheKey);
  if (cached) return cached;

  // Derive WCAG-guaranteed surface and script colors
  const primary = ensureSurfaceContrast(p0);
  const accent = ensureSurfaceContrast(a0);
  const script = ensureScriptContrast(darkenRgb(a0, 0.45), primary);

  const tokens: CustomThemeVariables = {
    "--yellow": rgbToHex(primary),
    "--yellow-deep": rgbToHex(darkenRgb(primary, 0.12)),
    "--pink": rgbToHex(accent),
    "--pink-deep": rgbToHex(darkenRgb(accent, 0.12)),
    "--berry": rgbToHex(script),
    "--blush": rgbToHex(lightenRgb(primary, 0.45)),
  };

  // Enforce bounded cache size
  if (THEME_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = THEME_CACHE.keys().next().value;
    if (oldestKey) THEME_CACHE.delete(oldestKey);
  }
  THEME_CACHE.set(cacheKey, tokens);

  return tokens;
}
