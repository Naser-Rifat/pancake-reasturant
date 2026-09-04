// Constants and helpers for the admin orders page.
import { ORDER_STATUSES } from "../status";

export const PAGE_SIZE = 12; // mirrors the backend's DRF PAGE_SIZE
export const FILTERS = ["all", ...ORDER_STATUSES] as const;
export const POLL_MS = 15_000;

export type OrderFilter = (typeof FILTERS)[number];

// Two short rising beeps for new incoming takeaway orders.
export function newOrderChime() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 880 : 1320;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.16);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* audio blocked until first user interaction — safe fallback */
  }
}
