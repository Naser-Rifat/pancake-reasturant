"use client";

import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className="footer-back-to-top"
      onClick={scrollToTop}
      aria-label="Back to top of page"
      title="Back to Top"
    >
      <span>Back to top</span>
      <ArrowUp size={14} strokeWidth={2.5} />
    </button>
  );
}
