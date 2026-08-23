import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { getSite } from "@/lib/api";

export default async function Footer() {
  const site = await getSite();
  const socials = [
    ["Instagram", site.instagram_url],
    ["Facebook", site.facebook_url],
  ].filter(([, url]) => url);

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <Link href="/" className="logo"><LogoMark /> krush</Link>
          <ul className="footer-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/booking">Book a Table</Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/#reviews">Reviews</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
          </ul>
          {socials.length > 0 ? (
            <ul className="footer-links">
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer">{label}</a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="footer-icons" aria-hidden="true">
              <LogoMark size={34} />
            </div>
          )}
        </div>
        <div className="footer-bottom">
          <span>© 2026 KRUSH — All rights reserved. {site.abn}</span>
          <span>Fluffy stacks · real maple · est. 1999</span>
        </div>
      </div>
    </footer>
  );
}
