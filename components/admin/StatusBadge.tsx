"use client";

/**
 * One pill for every order/booking status — the color mapping lived as a
 * copy-pasted ternary in four different files before this.
 */
const STYLES: Record<string, string> = {
  // orders
  received: "bg-amber-100 text-amber-950 border-amber-300",
  preparing: "bg-orange-100 text-orange-950 border-orange-300",
  ready: "bg-emerald-100 text-emerald-950 border-emerald-300",
  completed: "bg-zinc-100 text-zinc-700 border-zinc-300",
  // bookings
  pending: "bg-amber-100 text-amber-950 border-amber-300",
  confirmed: "bg-emerald-100 text-emerald-950 border-emerald-300",
  // shared
  cancelled: "bg-rose-100 text-rose-950 border-rose-300",
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
        STYLES[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-300"
      } ${className}`}
    >
      {status}
    </span>
  );
}
