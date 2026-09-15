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
  const shown = Boolean(data) && visible && !isPreview;

  useEffect(() => {
    // the class reserves layout space, so it must follow what actually renders
    document.body.classList.toggle("has-announce", shown);
    return () => document.body.classList.remove("has-announce");
  }, [shown]);

  if (!shown || !data) return null;

  const offerUrl =
    data.link_url === "/menu" || !data.link_url
      ? `/menu?tag=deals&offer=${encodeURIComponent(data.message)}`
      : safeHref(data.link_url);

  return (
    <aside className="announce" role="region" aria-label="Announcement">
      <Link
        href={offerUrl}
        className="announce-content"
        aria-label={`${data.message} ${data.link_text || "Explore"}`}
      >
        <span className="announce-msg">{data.message}</span>
        {data.link_text && (
          <span className="announce-link">
            {data.link_text}
          </span>
        )}
      </Link>
      <button
        className="announce-close"
        aria-label="Dismiss announcement"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setVisible(false);
          try {
            sessionStorage.setItem("krush-announce-closed", "1");
          } catch { /* storage blocked — dismiss for this view only */ }
        }}
      >
        ✕
      </button>
    </aside>
  );
}
