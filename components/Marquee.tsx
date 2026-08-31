// Brand ticker strip — shared by the home page and dish pages.
// Phrases come from site settings so claims like "Est. 1999" stay editable.
const FALLBACK = ["Fluffy Stacks", "Real Maple", "Fresh Berries", "Zero Guilt", "Griddled Daily"];

export default function Marquee({ words }: { words?: string[] }) {
  const list = words?.length ? words : FALLBACK;
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((i) => (
          <span key={i} style={{ display: "contents" }}>
            {list.map((w) => (
              <span key={w} style={{ display: "contents" }}>
                <span>{w}</span>
                <span>✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
