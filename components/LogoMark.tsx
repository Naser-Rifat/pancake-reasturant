/** The Pancake Club brand mark — syrup-butter wedge over a pancake stack,
 * recreated as SVG from the supplied logo (drop the original export in
 * /public/logo.svg to use it instead). */
export default function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path d="M24 5 L37 21 L11 21 Z" fill="#F0B03C" />
      <rect x="10" y="24" width="28" height="8" rx="4" fill="#E8993B" />
      <rect x="10" y="35" width="28" height="8" rx="4" fill="#C0761F" />
    </svg>
  );
}
