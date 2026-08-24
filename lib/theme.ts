// Custom-theme derivation: turns the two client-picked colours into the full
// V1 token set, enforcing WCAG contrast so no possible choice can make the
// site unreadable. Runs server-side in the (site) root layout.

import type { CSSProperties } from "react";

type RGB = { r: number; g: number; b: number };

const INK: RGB = { r: 0x21, g: 0x1a, b: 0x14 }; // --ink (fixed text colour)
const CREAM: RGB = { r: 0xf8, g: 0xf2, b: 0xe0 }; // --cream page background

function parse(hex: string): RGB | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
}

const clamp255 = (c: number) => Math.max(0, Math.min(255, Math.round(c)));
const toHex = ({ r, g, b }: RGB) =>
  "#" + [r, g, b].map((c) => clamp255(c).toString(16).padStart(2, "0")).join("");

function luminance({ r, g, b }: RGB) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: RGB, b: RGB) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const lighten = (c: RGB, amt: number): RGB => ({
  r: c.r + (255 - c.r) * amt,
  g: c.g + (255 - c.g) * amt,
  b: c.b + (255 - c.b) * amt,
});
const darken = (c: RGB, amt: number): RGB => ({
  r: c.r * (1 - amt),
  g: c.g * (1 - amt),
  b: c.b * (1 - amt),
});

/** Surfaces carry ink text — lighten until AA body-text contrast holds. */
function ensureSurface(c: RGB): RGB {
  let out = c;
  for (let i = 0; i < 24 && contrast(out, INK) < 4.5; i++) out = lighten(out, 0.08);
  return out;
}

/** Script accent is large display text — darken until it reads on both the
 *  custom surface and the cream page background. */
function ensureScript(c: RGB, surface: RGB): RGB {
  let out = c;
  for (let i = 0; i < 24 && (contrast(out, surface) < 3 || contrast(out, CREAM) < 4.5); i++)
    out = darken(out, 0.08);
  return out;
}

/** Full token set for theme === "custom"; null when a hex is malformed
 *  (the site then just renders the golden defaults). */
export function customThemeStyle(primaryHex: string, accentHex: string): CSSProperties | null {
  const p0 = parse(primaryHex);
  const a0 = parse(accentHex);
  if (!p0 || !a0) return null;
  const primary = ensureSurface(p0);
  const accent = ensureSurface(a0);
  const script = ensureScript(darken(a0, 0.45), primary);
  return {
    "--yellow": toHex(primary),
    "--yellow-deep": toHex(darken(primary, 0.12)),
    "--pink": toHex(accent),
    "--pink-deep": toHex(darken(accent, 0.12)),
    "--berry": toHex(script),
    "--blush": toHex(lighten(primary, 0.45)),
  } as CSSProperties;
}
