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
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      const hero = document.querySelector(".hero");
      if (hero) {
        setPastHero(y > 220);
      } else {
        setPastHero(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
