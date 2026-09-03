"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Deep-link landing for table rows: reads ?focus=<id> from the URL once,
 * then walks the loaded rows — pulling older server pages while the id is
 * still missing — jumps the numbered pagination to the row's page, scrolls
 * it into view and flashes it. The row element must carry id="row-<id>".
 */
export function useRowFocus<T>({
  rows,
  idOf,
  loading,
  loadingMore,
  hasMore,
  loadMore,
  setPage,
  pageSize,
  maxRows = 120,
  onMiss,
}: {
  rows: T[];
  idOf: (row: T) => string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  setPage: (page: number) => void;
  pageSize: number;
  maxRows?: number;
  onMiss?: () => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const missed = useRef(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("focus");
    if (id) setFocusId(id);
  }, []);

  useEffect(() => {
    if (!focusId || loading || loadingMore) return;
    const clearParam = () =>
      window.history.replaceState(null, "", window.location.pathname);

    const idx = rows.findIndex((r) => idOf(r) === focusId);
    if (idx >= 0) {
      setPage(Math.floor(idx / pageSize) + 1);
      setHighlightId(focusId);
      setFocusId(null);
      clearParam();
      const t1 = setTimeout(() => {
        document
          .getElementById(`row-${focusId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      const t2 = setTimeout(() => setHighlightId(null), 3500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    if (hasMore && rows.length < maxRows) {
      loadMore();
      return;
    }
    setFocusId(null);
    clearParam();
    if (!missed.current) {
      missed.current = true;
      onMiss?.();
    }
  }, [focusId, rows, idOf, loading, loadingMore, hasMore, loadMore, setPage, pageSize, maxRows, onMiss]);

  return { highlightId };
}
