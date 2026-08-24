/** Decorative brand-coloured "sticker" shapes scattered in section margins.
 * Purely visual: hidden from assistive tech, no pointer events, desktop only. */

type Kind = "sparkle" | "squiggle" | "arc" | "ring";

const SHAPES: Record<Kind, { viewBox: string; el: React.ReactNode }> = {
  sparkle: {
    viewBox: "0 0 64 64",
    el: <path d="M32 0 L38 26 L64 32 L38 38 L32 64 L26 38 L0 32 L26 26 Z" />,
  },
  squiggle: {
    viewBox: "0 0 80 48",
    el: (
      <path
        d="M4 24 C 14 4, 26 44, 38 24 S 62 4, 76 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    ),
  },
  arc: { viewBox: "0 0 80 40", el: <path d="M0 40 A 40 40 0 0 1 80 40 Z" /> },
  ring: {
    viewBox: "0 0 64 64",
    el: <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="10" />,
  },
};

export default function Sticker({
  kind,
  color,
  size = 64,
  style,
  className = "",
}: {
  kind: Kind;
  color: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { viewBox, el } = SHAPES[kind];
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size * (parseInt(viewBox.split(" ")[3]) / parseInt(viewBox.split(" ")[2]))}
      className={`stk ${className}`}
      style={{ color, ...style }}
      fill="currentColor"
      aria-hidden="true"
    >
      {el}
    </svg>
  );
}
