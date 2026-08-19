"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Adds the .visible class to .reveal elements as they scroll into view.
export default function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
