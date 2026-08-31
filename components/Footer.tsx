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
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer">{label}</a>
                </li>
              ))}
            </ul>
            <Link href="/booking" className="btn btn-primary f-cta">Book a Table</Link>
          </div>
        </div>

        <div className="footer-mark" aria-hidden="true">The Pancake Club</div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} The Pancake Club — All rights reserved. {site.abn}</span>
          <span>{site.footer_tagline}</span>
        </div>
      </div>
    </footer>
  );
}
