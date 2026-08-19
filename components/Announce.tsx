"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApiAnnouncement } from "@/lib/api";

export default function Announce({ data }: { data: ApiAnnouncement | null }) {
  const [visible, setVisible] = useState(Boolean(data));

  useEffect(() => {
    if (sessionStorage.getItem("krush-announce-closed")) setVisible(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-announce", visible);
    return () => document.body.classList.remove("has-announce");
  }, [visible]);

  if (!data || !visible) return null;

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
