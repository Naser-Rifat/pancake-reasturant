// Line icons for accreditation badges. Colour emoji reads like a chat message
// next to a food-safety claim; a single-weight stroke reads like a credential.
// Unknown values fall through, so an emoji typed in the admin still renders.

const PATHS: Record<string, React.ReactNode> = {
  shield: <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.3 7.5 9.5 4.4-1.2 7.5-5.1 7.5-9.5V6L12 3Z" />,
  star: <path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 17l-5.2 2.9 1-5.9-4.3-4.2 5.9-.8L12 3.6Z" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4.5V7a3.5 3.5 0 0 0 3 3.4M17 5.5h2.5V7a3.5 3.5 0 0 1-3 3.4" />
      <path d="M12 14v3.5M8.5 20.5h7M9.5 20.5c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4c0 8-4.6 12.5-10.5 12.5A5.5 5.5 0 0 1 4 11C4 5.6 11 4 20 4Z" />
      <path d="M15 8.5C10.5 10.5 7 14 5.5 20" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M9 9.4 7 3.5h10l-2 5.9M12 12.4l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L9.1 14.6l2-.3.9-1.9Z" />
    </>
  ),
};

export const CERT_ICONS = Object.keys(PATHS);

export default function CertIcon({ name }: { name: string }) {
  const art = PATHS[name?.trim().toLowerCase()];
  if (!art) return <span className="emoji">{name}</span>;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}
