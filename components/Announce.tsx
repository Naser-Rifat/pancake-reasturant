"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ApiAnnouncement } from "@/lib/api";
import { safeHref } from "@/lib/utils";

export default function Announce({ data }: { data: ApiAnnouncement | null }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(Boolean(data));

  useEffect(() => {
    try {
      if (sessionStorage.getItem("krush-announce-closed")) setVisible(false);
    } catch { /* storage blocked (private mode) — just show it */ }
  }, []);

  // hidden on the standalone preview route; home shows the campaign strip
  // instead — never both on one page. Folded into `shown` (not an early return)
  // so the hook order above never changes between renders.
  const isPreview = pathname === "/preview" || pathname?.startsWith("/preview");
  const shown = Boolean(data) && visible && !isPreview && !(data?.image && pathname === "/");

  useEffect(() => {
    // the class reserves layout space, so it must follow what actually renders
    document.body.classList.toggle("has-announce", shown);
    return () => document.body.classList.remove("has-announce");
  }, [shown]);

  if (!shown || !data) return null;

  return (
    <div className="announce">
      <span>
        {data.message}{" "}
        {data.link_text && <Link href={safeHref(data.link_url)}>{data.link_text}</Link>}
      </span>
      <button
        className="announce-close"
        aria-label="Dismiss announcement"
        onClick={() => {
          setVisible(false);
          try {
            sessionStorage.setItem("krush-announce-closed", "1");
          } catch { /* storage blocked — dismiss for this view only */ }
        }}
      >
        ✕
      </button>
    </div>
  );
}
