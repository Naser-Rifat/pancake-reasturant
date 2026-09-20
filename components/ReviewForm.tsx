"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PenLine, Sparkles, Send, X, User, MapPin } from "lucide-react";
import { submitReview } from "@/lib/api";

export default function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const reviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: () => setDone(true),
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Something went wrong — please try again."),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    reviewMutation.mutate({
      name: name.trim(),
      suburb: suburb.trim(),
      rating,
      quote: quote.trim(),
    });
  };

  if (done) {
    return (
      <div className="rev-form-wrap">
        <div className="rev-form rev-thanks-card" role="status">
          <span className="rev-thanks-icon">🎉🥞</span>
          <p className="rev-thanks">
            Thanks a bunch, <strong>{name.split(" ")[0]}</strong>! Your note has been added to our
            guestbook — it&apos;ll appear on the wall once our team reviews it!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rev-form-wrap">
      {!open ? (
        <button
          type="button"
          className="btn btn-primary rev-write-cta"
          onClick={() => setOpen(true)}
        >
          <PenLine size={16} className="mr-1 inline-block" />
          <span>Leave a Guestbook Note</span>
        </button>
      ) : (
        <form className="rev-form rev-diner-form" onSubmit={submit}>
          <div className="rev-form-header">
            <h3>✍️ Leave a Note in Our Guestbook</h3>
            <button
              type="button"
              className="rev-form-close"
              onClick={() => setOpen(false)}
              aria-label="Close review form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rev-form-row">
            <div className={`float-field ${name ? "is-floated" : ""}`}>
              <input
                id="rev-name"
                className="float-input"
                placeholder="Your name *"
                required
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
              <label htmlFor="rev-name" className="float-label">
                Your Name *
              </label>
              <User size={16} className="float-icon" aria-hidden="true" />
            </div>

            <div className={`float-field ${suburb ? "is-floated" : ""}`}>
              <input
                id="rev-suburb"
                className="float-input"
                placeholder="Suburb / Area (e.g. Geelong)"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
              />
              <label htmlFor="rev-suburb" className="float-label">
                Suburb / Area (e.g. Geelong)
              </label>
              <MapPin size={16} className="float-icon" aria-hidden="true" />
            </div>
          </div>

          <div className="star-picker-wrap">
            <span className="star-picker-label">Your Rating:</span>
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
          </div>

          <div className={`float-field textarea-field ${quote ? "is-floated" : ""}`}>
            <textarea
              id="rev-quote"
              className="float-input rev-textarea"
              rows={3}
              placeholder="Tell us about your favorite stack, coffee, or brunch vibes… *"
              required
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
            <label htmlFor="rev-quote" className="float-label">
              Tell us about your favorite stack, coffee, or brunch vibes… *
            </label>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="rev-form-actions">
            <button className="btn btn-primary" type="submit" disabled={reviewMutation.isPending}>
              <Send size={15} className="mr-1 inline-block" />
              <span>{reviewMutation.isPending ? "Sending note…" : "Post to Guestbook"}</span>
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
