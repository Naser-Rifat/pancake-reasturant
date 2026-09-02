import Link from "next/link";
import { formatTime, getHours, getSite, telHref } from "@/lib/api";
import BackToTop from "@/components/BackToTop";

const LINKS = [
  ["Menu", "/menu"],
  ["About Us", "/#about"],
  ["Gallery", "/gallery"],
  ["Reviews", "/#reviews"],
  ["Find Us", "/#contact"],
];

export default async function Footer() {
  const [site, hours] = await Promise.all([getSite(), getHours()]);
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Single Cohesive 4-Column Master Grid with Perfect Baseline Alignment */}
        <div className="footer-master-grid">
          {/* Column 1: Brand & Actions */}
          <div className="f-col f-col-brand">
            <span
              className="f-brand-logo"
              role="img"
              aria-label="The Pancake Club"
            />
            <p className="f-brand-tag">
              {site.footer_tagline || "Fluffy stacks · real maple · est. 1999"}
            </p>

            <div className="f-actions">
              <Link href="/booking" className="btn btn-primary f-cta-btn">
                Book a Table
              </Link>
              {site.uber_eats_url && (
                <a
                  href={site.uber_eats_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary f-cta-btn f-uber-btn"
                >
                  Uber Eats
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Visit */}
          <div className="f-col f-col-visit">
            <h2 className="f-col-title">Visit</h2>
            <address className="f-address-block">
              <span className="f-address-text">{site.address}</span>
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="f-directions-link"
              >
                Get directions →
              </a>
              <a href={telHref(site.phone)} className="f-contact-link">
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="f-contact-link">
                {site.email}
              </a>
            </address>
          </div>

          {/* Column 3: Opening Hours */}
          <div className="f-col f-col-hours">
            <h2 className="f-col-title">Opening Hours</h2>
            <ul className="f-hours-list">
              {hours.map((h) => (
                <li key={h.label} className="f-hours-item">
                  <span className="f-day-label">{h.label}</span>
                  <span className="f-time-label">
                    {formatTime(h.opens)} – {formatTime(h.closes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Explore */}
          <div className="f-col f-col-explore">
            <h2 className="f-col-title">Explore</h2>
            <ul className="f-explore-list">
              {LINKS.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="f-explore-link">
                    {label}
                  </Link>
                </li>
              ))}
              {site.instagram_url && (
                <li>
                  <a
                    href={site.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="f-explore-link"
                  >
                    Instagram ↗
                  </a>
                </li>
              )}
              {site.facebook_url && (
                <li>
                  <a
                    href={site.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="f-explore-link"
                  >
                    Facebook ↗
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Back to Top Bar */}
        <div className="footer-bottom-bar">
          <p className="f-copyright-text">
            © {new Date().getFullYear()} The Pancake Club — All rights reserved. {site.abn}
          </p>
          <div className="f-back-to-top-container">
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
