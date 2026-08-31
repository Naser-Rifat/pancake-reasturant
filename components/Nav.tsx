"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/LogoMark";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the home page the hero carries its own nav inside the gold panel, so this
  // header stays out of the way — but it has to take over once the hero scrolls
  // away, or the rest of the page has no navigation at all.
  useEffect(() => {
    // Watch the panel's own nav, not the whole hero: this header should take
    // over the moment that one scrolls out of sight, so the brand is never off
    // screen and the two navs are never on screen together.
    const panelNav = document.querySelector(".hero-nav");
    if (!panelNav) { setPastHero(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(panelNav);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}${pastHero ? " past-hero" : ""}`}>
      <div className="container nav-inner">
        <Link href="/" className="logo" aria-label="The Pancake Club — home">
          <span className="logo-mark" aria-hidden="true"><LogoMark /></span>
          <Image src="/logo.png" alt="The Pancake Club" width={529} height={226} priority className="logo-word" />
        </Link>

        <ul className={`nav-links${open ? " open" : ""}`}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={pathname === l.href ? "active" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-cta">
          <Link href="/booking" className="btn btn-primary">Book a Table</Link>
          <button
            className={`burger-toggle${open ? " open" : ""}`}
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
