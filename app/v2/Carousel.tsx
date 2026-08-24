"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Scroll-snap carousel with the reference's round prev/next buttons.
 * Arrows only render when the row actually overflows. */
export default function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canSlide, setCanSlide] = useState(false);

  useEffect(() => {
    const check = () => {
      const el = ref.current;
      setCanSlide(!!el && el.scrollWidth > el.clientWidth + 4);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const go = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const tile = el.querySelector<HTMLElement>(":scope > *");
    el.scrollBy({ left: dir * ((tile?.offsetWidth ?? 320) + 16), behavior: "smooth" });
  };

  return (
    <div className="v2-car">
      <div className="v2-car-track" ref={ref}>{children}</div>
      {canSlide && (
        <>
          <button className="v2-car-btn prev" aria-label="Previous items" onClick={() => go(-1)}>←</button>
          <button className="v2-car-btn next" aria-label="Next items" onClick={() => go(1)}>→</button>
        </>
      )}
    </div>
  );
}
