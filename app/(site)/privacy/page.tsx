import type { Metadata } from "next";
import { getSite, telHref } from "@/lib/api";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The Pancake Club collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const site = await getSite();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Privacy <span className="accent">Policy.</span></h1>
          <p>Last updated: September 2026</p>
        </div>
      </section>

      <main className="container legal">
        <p>
          The Pancake Club (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting
          your personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the
          Australian Privacy Principles (APPs). This policy explains what we collect, why, and your rights.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Pickup orders</strong> — your name, email address and phone number, so we can prepare your order and let you know when it&rsquo;s ready.</li>
          <li><strong>Table bookings</strong> — your name, email address, phone number, booking date/time, party size and any notes you add.</li>
          <li><strong>Reviews</strong> — the name, suburb and review text you choose to submit.</li>
          <li><strong>Club registrations</strong> — your name, email address, registration date and privacy acknowledgement. We also record whether you separately opted in to marketing emails and when you submitted that consent.</li>
        </ul>
        <p>
          Website pickup orders are currently paid at the counter when collected. This website does
          not ask for, collect or store payment-card details.
        </p>

        <h2>How we use it</h2>
        <ul>
          <li>To prepare and hand over your order, and to email you order updates (confirmation, ready-for-pickup, or a cancellation with the reason)</li>
          <li>To manage your table booking and email you when it&rsquo;s confirmed or declined</li>
          <li>To publish your review on our website — only after our staff approve it, and only the details you submitted</li>
          <li>To manage your club registration and email preferences. Marketing consent is optional and separate from joining. Contact us to change your details, withdraw consent or request deletion of your registration.</li>
        </ul>
        <p>
          We send transactional messages about your order, booking or club registration. We do not
          send marketing emails without your separate consent, consistent with the
          <em> Spam Act 2003</em> (Cth).
        </p>

        <h2>Who we share it with</h2>
        <p>
          We do not sell or rent your personal information. It is stored with our website hosting and
          email delivery providers, who process it only to operate this website. Some providers may
          store data outside Australia; we choose reputable providers with appropriate safeguards.
        </p>

        <h2>Security &amp; retention</h2>
        <p>
          Personal information is transmitted over HTTPS and protected by access controls — only
          authorised staff can view orders and bookings. We keep order and booking records for our
          business records and delete or de-identify them when no longer needed.
        </p>

        <h2>Access, correction &amp; complaints</h2>
        <p>
          You can ask us to access, correct or delete the personal information we hold about you —
          email <a href={`mailto:${site.email}`}>{site.email}</a> or call{" "}
          <a href={telHref(site.phone)}>{site.phone}</a>. If you have a privacy concern we can&rsquo;t
          resolve, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).
        </p>
      </main>
    </>
  );
}
