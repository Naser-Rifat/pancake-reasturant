import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Book a Table | KRUSH Pancakes & Stacks",
  description:
    "Book a table at KRUSH online — free, instant confirmation, open 7 days. Large groups welcome by phone.",
};

export default function BookingPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="kicker">Reserve Online — Free &amp; Instant</p>
          <h1>Book a <span className="accent">Table.</span></h1>
          <p>Pick a date, pick a time — we&apos;ll have the griddle hot when you arrive.</p>
        </div>
      </section>

      <main className="container booking-grid">
        <div className="widget-card reveal">
          <h3>📅 Online Reservation</h3>
          <p>Tell us when — we&apos;ll confirm by email. No fees, ever.</p>
          <BookingForm />
        </div>

        <aside className="fallback-card reveal">
          <h3>👥 Big Group or Special Event?</h3>
          <p>
            For groups of 10+, functions, or birthday bookings, give us a call and
            we&apos;ll sort you out directly — cake smuggling encouraged.
          </p>
          <a className="phone" href="tel:+61255501234">(02) 5550 1234</a>
          <p style={{ marginTop: "1.2rem", marginBottom: 0 }}>
            Open 7 days · 123 George Street, Sydney NSW 2000<br />
            <a href="mailto:hello@krushpancakes.com.au">hello@krushpancakes.com.au</a>
          </p>
        </aside>
      </main>
    </>
  );
}
