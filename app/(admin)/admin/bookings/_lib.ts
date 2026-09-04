// Constants and helpers for the admin bookings page.

export const PAGE_SIZE = 12; // mirrors the backend's DRF PAGE_SIZE
export const FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;
export const POLL_MS = 20_000;

export type BookingFilter = (typeof FILTERS)[number];

export type PhoneBooking = {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  party_size: string;
  notes: string;
};

export const EMPTY_PHONE_BOOKING: PhoneBooking = {
  name: "",
  phone: "",
  email: "",
  date: "",
  time: "",
  party_size: "2",
  notes: "",
};

/** 24h "13:30" → friendly "1:30 PM". */
export function formatTime12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr || "00"} ${ampm}`;
}

// Two-tone chime for new incoming booking requests.
export function newBookingChime() {
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
