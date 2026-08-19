import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <Link href="/" className="logo">🥞 krush</Link>
          <ul className="footer-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/booking">Book a Table</Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/#reviews">Reviews</Link></li>
          </ul>
          <div className="footer-icons">
            <span>🥞</span><span>🍯</span><span>🍓</span><span>🧈</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 KRUSH — All rights reserved. ABN 00 000 000 000</span>
          <span>Fluffy stacks · real maple · est. 1999</span>
        </div>
      </div>
    </footer>
  );
}
