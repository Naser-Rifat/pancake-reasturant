"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Numbered pagination over rows the page has loaded so far. When the viewer
 * steps past the last loaded page and the server still has older rows, the
 * parent fetches the next server page (the total shows as "N+" until the far
 * end is known).
 */
export function Pagination({
  page,
  pageSize,
  totalLoaded,
  serverHasMore,
  loading = false,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalLoaded: number;
  serverHasMore: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  const knownPages = Math.max(1, Math.ceil(totalLoaded / pageSize));
  if (knownPages <= 1 && !serverHasMore) return null;

  // compact window: 1 … p-1 p p+1 … last
  const nums: (number | "…")[] = [];
  for (let n = 1; n <= knownPages; n++) {
    if (n === 1 || n === knownPages || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }

  return (
    <nav
      aria-label="Pagination"
      className="p-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#eee3d5] bg-[#faf5ee]/50"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="h-9 border-[#d9c7b4] text-[#763a12] font-bold text-xs rounded-xl"
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </Button>

      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-xs font-bold text-zinc-400">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onPageChange(n)}
            className={`h-9 min-w-9 px-2 rounded-xl text-xs font-black transition-all ${
              n === page
                ? "bg-[#763a12] text-white shadow-xs"
                : "bg-white text-[#211a14] border border-[#d9c7b4] hover:bg-[#faf5ee]"
            }`}
          >
            {n}
          </button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        loading={loading}
        disabled={(page >= knownPages && !serverHasMore) || loading}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="h-9 border-[#d9c7b4] text-[#763a12] font-bold text-xs rounded-xl"
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>

      <span className="w-full sm:w-auto sm:ml-2 text-center text-[11px] font-bold text-zinc-500">
        Page {Math.min(page, knownPages)} of {knownPages}
        {serverHasMore ? "+" : ""}
      </span>
    </nav>
  );
}
