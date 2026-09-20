"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createBooking, type ApiBooking } from "@/lib/api";
import { formatBookingRef } from "@/lib/order-utils";
import { validatePhoneNumber } from "@/lib/format";
import { Calendar, Clock, Mail, Phone, User, Users } from "lucide-react";

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
  const [offer, setOffer] = useState<string>("");
  const [dateFocused, setDateFocused] = useState(false);
  const [timeFocused, setTimeFocused] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const offerParam = params.get("offer") || params.get("campaign") || params.get("deal");
      if (offerParam) {
        setOffer(offerParam);
      }
    } catch { /* ignore */ }
  }, []);

  // several favourites, not one — joined into the booking's text field on submit
  const [dishes, setDishes] = useState<string[]>([]);
  // past this many dishes the chip wall would push the form apart — collapse the tail
  const CHIP_LIMIT = 8;
  const [showAllDishes, setShowAllDishes] = useState(false);
  const toggleDish = (label: string) =>
    setDishes((d) => (d.includes(label) ? d.filter((x) => x !== label) : [...d, label]));
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: setBooking,
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Something went wrong — please try again."),
  });

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleDateFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setDateFocused(true);
    try {
      e.target.showPicker?.();
    } catch { /* ignore */ }
  };
  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setDateFocused(true);
    try {
      (e.target as HTMLInputElement).showPicker?.();
    } catch { /* ignore */ }
  };
  const handleTimeFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeFocused(true);
    try {
      e.target.showPicker?.();
    } catch { /* ignore */ }
  };
  const handleTimeClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setTimeFocused(true);
    try {
      (e.target as HTMLInputElement).showPicker?.();
    } catch { /* ignore */ }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      document.getElementById("booking-phone")?.focus();
      return;
    }

    const phoneValidation = validatePhoneNumber(form.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || "Please enter a valid phone number.");
      document.getElementById("booking-phone")?.focus();
      return;
    }

    const finalNotes = offer
      ? (form.notes.trim() ? `${form.notes.trim()} · [Offer: ${offer}]` : `Special Offer: ${offer}`)
      : form.notes;

    bookingMutation.mutate({
      ...form,
      notes: finalNotes,
      party_size: Number(form.party_size),
      preselected_dish: dishes.join(", "),
    });
  };

  if (booking) {
    return (
      <div className="widget-slot" role="status">
        <span className="big">✅</span>
        <b>Request received, {form.name.split(" ")[0]}!</b>
        <div style={{ margin: "4px 0", fontSize: "0.85rem", fontWeight: 700, color: "#763a12", letterSpacing: "0.02em" }}>
          Reservation Reference: <span style={{ background: "#fef3c7", border: "1px solid #fcd34d", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace" }}>#{formatBookingRef(booking.public_id)}</span>
        </div>
        <span>
          {booking.date} at {booking.time.slice(0, 5)} for {booking.party_size}
          {dishes.length > 0 ? ` (${dishes.join(", ")})` : ""}
          {offer ? ` · Special Offer "${offer}" linked` : ""} — we&apos;ll
          email {form.email} as soon as it&apos;s confirmed.
        </span>
        {booking.email_delivery === "failed" && (
          <span className="form-error" role="alert">
            Your request is saved, but we couldn&apos;t send the acknowledgement email.
            Keep this page and call us if you need to confirm the request.
          </span>
        )}
      </div>
    );
  }

  return (
    <form className="bk-form" onSubmit={submit}>
      {offer && (
        <div className="bk-offer-badge" role="status">
          <span className="bk-offer-sparkle">🎁</span>
          <div className="bk-offer-info">
            <span className="bk-offer-tag">Special Offer Reservation</span>
            <strong className="bk-offer-name">{offer}</strong>
          </div>
          <span className="bk-offer-chip">Offer Linked ✓</span>
        </div>
      )}
      {/* Name Field */}
      <div className={`bk-float-field ${form.name ? "is-floated" : ""}`}>
        <input
          id="booking-name"
          className="bk-float-input"
          placeholder="Your name *"
          required
          value={form.name}
          autoComplete="name"
          onChange={set("name")}
        />
        <label htmlFor="booking-name" className="bk-float-label">
          Your Name *
        </label>
        <User size={18} className="bk-float-icon" aria-hidden="true" />
      </div>

      {/* Email Field */}
      <div className={`bk-float-field ${form.email ? "is-floated" : ""}`}>
        <input
          id="booking-email"
          className="bk-float-input"
          type="email"
          placeholder="Email *"
          required
          value={form.email}
          autoComplete="email"
          onChange={set("email")}
        />
        <label htmlFor="booking-email" className="bk-float-label">
          Email Address *
        </label>
        <Mail size={18} className="bk-float-icon" aria-hidden="true" />
      </div>

      {/* Phone Field */}
      <div className={`bk-float-field ${form.phone ? "is-floated" : ""}`}>
        <input
          id="booking-phone"
          className="bk-float-input"
          type="tel"
          placeholder="Phone *"
          required
          aria-required="true"
          value={form.phone}
          autoComplete="tel"
          inputMode="tel"
          onChange={set("phone")}
        />
        <label htmlFor="booking-phone" className="bk-float-label">
          Phone Number *
        </label>
        <Phone size={18} className="bk-float-icon" aria-hidden="true" />
      </div>

      {/* Date & Time Row */}
      <div className="bk-row">
        {/* Date Field */}
        <div className={`bk-float-field ${form.date || dateFocused ? "is-floated" : ""}`}>
          <input
            id="booking-date"
            className="bk-float-input"
            type={dateFocused || form.date ? "date" : "text"}
            required
            min={new Date().toISOString().split("T")[0]}
            value={form.date}
            placeholder=" "
            onFocus={handleDateFocus}
            onClick={handleDateClick}
            onBlur={() => setDateFocused(false)}
            onChange={set("date")}
          />
          <label htmlFor="booking-date" className="bk-float-label">
            Date *
          </label>
          <Calendar size={18} className="bk-float-icon" aria-hidden="true" />
        </div>

        {/* Time Field */}
        <div className={`bk-float-field ${form.time || timeFocused ? "is-floated" : ""}`}>
          <input
            id="booking-time"
            className="bk-float-input"
            type={timeFocused || form.time ? "time" : "text"}
            required
            value={form.time}
            placeholder=" "
            onFocus={handleTimeFocus}
            onClick={handleTimeClick}
            onBlur={() => setTimeFocused(false)}
            onChange={set("time")}
          />
          <label htmlFor="booking-time" className="bk-float-label">
            Time *
          </label>
          <Clock size={18} className="bk-float-icon" aria-hidden="true" />
        </div>
      </div>

      {/* Party Size Select */}
      <div className="bk-float-field is-floated">
        <select
          id="booking-party-size"
          className="bk-float-input"
          value={form.party_size}
          onChange={set("party_size")}
          aria-label="Party size"
        >
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest (Solo)" : "guests"}
            </option>
          ))}
        </select>
        <label htmlFor="booking-party-size" className="bk-float-label">
          Party Size (Guests) *
        </label>
        <Users size={18} className="bk-float-icon" aria-hidden="true" />
      </div>

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

      {/* Special Requests / Notes */}
      <div className={`bk-float-field textarea-field ${form.notes ? "is-floated" : ""}`}>
        <textarea
          id="booking-notes"
          className="bk-float-input"
          rows={2}
          placeholder=" "
          value={form.notes}
          onChange={set("notes")}
        />
        <label htmlFor="booking-notes" className="bk-float-label">
          Special requests or dietary needs (optional)
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={bookingMutation.isPending}>
        {bookingMutation.isPending ? "Sending…" : "Request a Table"}
      </button>
    </form>
  );
}
