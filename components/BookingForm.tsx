"use client";

import { useState } from "react";
import { createBooking, type ApiBooking } from "@/lib/api";

interface BookingFormProps {
  menuItems?: { slug: string; name: string; price: string }[];
}

export default function BookingForm({ menuItems = [] }: BookingFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    party_size: 2,
    notes: "",
  });
  // several favourites, not one — joined into the booking's text field on submit
  const [dishes, setDishes] = useState<string[]>([]);
  // past this many dishes the chip wall would push the form apart — collapse the tail
  const CHIP_LIMIT = 8;
  const [showAllDishes, setShowAllDishes] = useState(false);
  const toggleDish = (label: string) =>
    setDishes((d) => (d.includes(label) ? d.filter((x) => x !== label) : [...d, label]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<ApiBooking | null>(null);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      setBooking(
        await createBooking({
          ...form,
          party_size: Number(form.party_size),
          preselected_dish: dishes.join(", "),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (booking) {
    return (
      <div className="widget-slot" role="status">
        <span className="big">✅</span>
        <b>Request received, {form.name.split(" ")[0]}!</b>
        <span>
          {booking.date} at {booking.time.slice(0, 5)} for {booking.party_size}
          {dishes.length > 0 ? ` (${dishes.join(", ")})` : ""} — we&apos;ll
          email {form.email} as soon as it&apos;s confirmed.
        </span>
      </div>
    );
  }

  return (
    <form className="bk-form" onSubmit={submit}>
      <input className="input" placeholder="Your name *" required value={form.name} autoComplete="name" onChange={set("name")} />
      <input className="input" type="email" placeholder="Email *" required value={form.email} autoComplete="email" onChange={set("email")} />
      <input className="input" placeholder="Phone (optional)" value={form.phone} autoComplete="tel" inputMode="tel" onChange={set("phone")} />
      <div className="bk-row">
        <input className="input" type="date" required min={new Date().toISOString().split("T")[0]} value={form.date} onChange={set("date")} aria-label="Date" />
        <input className="input" type="time" required value={form.time} onChange={set("time")} aria-label="Time" />
      </div>
      <select className="input" value={form.party_size} onChange={set("party_size")} aria-label="Party size">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
        ))}
      </select>
      {menuItems.length > 0 && (
        <fieldset className="bk-dishes">
          {/* toggle chips, not a multiple <select>: several favourites should be
              one tap each, and native multi-selects need ctrl-click */}
          <legend>🥞 Pre-select favourites (optional{dishes.length > 0 ? ` · ${dishes.length} picked` : ""})</legend>
          <div className="bk-dish-chips">
            {(showAllDishes ? menuItems : menuItems.slice(0, CHIP_LIMIT)).map((item) => {
              const label = `${item.name} ($${item.price})`;
              const on = dishes.includes(label);
              return (
                <button
                  type="button"
                  key={item.slug}
                  className={`bk-dish-chip${on ? " on" : ""}`}
                  aria-pressed={on}
                  onClick={() => toggleDish(label)}
                >
                  {on ? "✓ " : ""}{item.name} — ${item.price}
                </button>
              );
            })}
            {menuItems.length > CHIP_LIMIT && (
              <button
                type="button"
                className="bk-dish-chip bk-dish-more"
                aria-expanded={showAllDishes}
                onClick={() => setShowAllDishes((v) => !v)}
              >
                {showAllDishes ? "Show less" : `+ Show all (${menuItems.length})`}
              </button>
            )}
          </div>
        </fieldset>
      )}
      <textarea className="input" rows={2} placeholder="Anything we should know? Special requests or dietary needs (optional)" value={form.notes} onChange={set("notes")} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Request a Table"}
      </button>
    </form>
  );
}
