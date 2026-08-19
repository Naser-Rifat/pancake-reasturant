import type { BadgeProps } from "@/components/ui/badge";

export const STATUS_BADGE: Record<string, BadgeProps["variant"]> = {
  // orders
  received: "info",
  preparing: "warning",
  ready: "success",
  completed: "secondary",
  cancelled: "destructive",
  // bookings
  pending: "warning",
  confirmed: "success",
};

export const ORDER_STATUSES = ["received", "preparing", "ready", "completed", "cancelled"] as const;
