/** Hand-drawn pancake-stack mark — inherits the text colour around it. */
export default function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
    >
      <ellipse cx="24" cy="33" rx="17" ry="6" />
      <ellipse cx="24" cy="25" rx="14" ry="5.5" />
      <ellipse cx="24" cy="17" rx="11" ry="5" />
      <rect x="19" y="9" width="10" height="6" rx="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
