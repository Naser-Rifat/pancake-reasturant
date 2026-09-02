import Link from "next/link";
import { formatTime, getHours, getSite, telHref } from "@/lib/api";

const LINKS = [
  ["Menu", "/menu"],
  ["About Us", "/#about"],
  ["Gallery", "/gallery"],
  ["Reviews", "/#reviews"],
  ["Find Us", "/#contact"],
];

export default async function Footer() {
  const [site, hours] = await Promise.all([getSite(), getHours()]);
  const socials = [
    ["Instagram", site.instagram_url],
    ["Facebook", site.facebook_url],
  ].filter(([, url]) => url);
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

  return (
    <footer>
      <div className="container">
        {/* editorial split: the brand speaks on the left, the directory sits on
            the right — the flat 3-column grid left a dead zone under Visit and
            orphaned the buttons in Explore's corner */}
        <div className="footer-split">
          <div className="f-brand">
            {/* the reversed lockup: the real logo's exact shapes, filled cream via
                a mask — its own dark strokes measure 1.6:1 on this ground, and a
                cream chip read as a sticker slapped on the footer */}
            <span className="f-brand-logo" role="img" aria-label="The Pancake Club" />
            <p className="f-brand-tag">{site.footer_tagline}</p>
            <div className="f-actions">
              <Link href="/booking" className="btn btn-primary f-cta">Book a Table</Link>
              {site.uber_eats_url && (
                <a
                  href={site.uber_eats_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary f-cta"
                >
                  Uber Eats
                </a>
              )}
            </div>
          </div>

          <div className="footer-grid">
          <div className="f-col">
            <h2>Visit</h2>
            <address>
              <span>{site.address}</span>
              <a href={directions} target="_blank" rel="noopener noreferrer" className="f-directions">
                Get directions
              </a>
              <a href={telHref(site.phone)}>{site.phone}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </address>
          </div>

          <div className="f-col">
            <h2>Opening hours</h2>
            <ul className="f-hours">
              {hours.map((h) => (
                <li key={h.label}>
                  <span>{h.label}</span>
                  <span>{formatTime(h.opens)} – {formatTime(h.closes)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="f-col">
            <h2>Explore</h2>
            <ul className="f-links">
              {LINKS.map(([label, href]) => (
                <li key={href}><Link href={href}>{label}</Link></li>
              ))}
              {site.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi! I'd like to ask about The Pancake Club")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer">{label}</a>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} The Pancake Club — All rights reserved. {site.abn}</span>
        </div>
      </div>
    </footer>
  );
}
