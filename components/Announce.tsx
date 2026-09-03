"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ApiAnnouncement } from "@/lib/api";

export default function Announce({ data }: { data: ApiAnnouncement | null }) {
  const pathname = usePathname();
  if (pathname === "/preview" || pathname?.startsWith("/preview")) {
    return null;
  }
  const [visible, setVisible] = useState(Boolean(data));

  useEffect(() => {
    if (sessionStorage.getItem("krush-announce-closed")) setVisible(false);
  }, []);

  // the home page shows the campaign strip instead — never both on one page
  const shown = Boolean(data) && visible && !(data?.image && pathname === "/");

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
        {data.link_text && <Link href={data.link_url || "/"}>{data.link_text}</Link>}
      </span>
      <button
        className="announce-close"
        aria-label="Dismiss announcement"
        onClick={() => {
          setVisible(false);
          sessionStorage.setItem("krush-announce-closed", "1");
        }}
      >
        ✕
      </button>
    </div>
  );
}
