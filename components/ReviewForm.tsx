"use client";

import { useState } from "react";
import { submitReview } from "@/lib/api";

export default function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await submitReview({ name: name.trim(), suburb: suburb.trim(), rating, quote: quote.trim() });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rev-form-wrap">
        <div className="rev-form" role="status">
          <p className="rev-thanks">
            Thanks, {name.split(" ")[0]}! Your review is in — it&apos;ll appear here
            once our team gives it a quick look.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rev-form-wrap">
      {!open ? (
        <button className="btn btn-ghost" onClick={() => setOpen(true)}>
          Write a Review
        </button>
      ) : (
        <form className="rev-form" onSubmit={submit}>
          <div className="rev-form-row">
            <input
              className="input"
              placeholder="Your name *"
              required
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Suburb (optional)"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
            />
          </div>
          <div className="star-picker" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={`star-btn${n <= rating ? " on" : ""}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="How were the stacks? *"
            required
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="rev-form-actions">
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? "Sending…" : "Submit Review"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
