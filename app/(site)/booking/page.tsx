import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";
import { getMenu, getSite, telHref } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Table",
  description:
    "Book a table at The Pancake Club online — free, instant confirmation, open 7 days. Large groups welcome by phone.",
  alternates: { canonical: "/booking" },
};

export default async function BookingPage() {
  const [site, menu] = await Promise.all([getSite(), getMenu()]);
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
          <h3>Online Reservation</h3>
          <p>Tell us when — we&apos;ll confirm by email. No fees, ever.</p>
          <BookingForm menuItems={menu} />
        </div>

        <aside className="fallback-card reveal">
          <h3>Big Group or Special Event?</h3>
          <p>
            For groups of 10+, functions, or birthday bookings, give us a call and
            we&apos;ll sort you out directly — cake smuggling encouraged.
          </p>
          <a className="phone" href={telHref(site.phone)}>{site.phone}</a>
          <p style={{ marginTop: "1.2rem", marginBottom: 0 }}>
            Open 7 days · {site.address}<br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        </aside>
      </main>
    </>
  );
}
