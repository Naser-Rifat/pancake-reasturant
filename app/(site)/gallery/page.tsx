import type { Metadata } from "next";
import GalleryClient from "@/components/GalleryClient";
import Sticker from "@/components/Sticker";
import { getGallery } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from The Pancake Club — our food, our space, and the good times in between.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const photos = await getGallery();

  return (
    <div className="gallery-scrapbook-page">
      <section className="page-hero gallery-hero">
        <Sticker
          kind="sparkle"
          color="var(--yellow-deep)"
          size={48}
          style={{ top: "3.5rem", left: "6%", transform: "rotate(-12deg)" }}
        />
        <Sticker
          kind="squiggle"
          color="var(--pink)"
          size={70}
          style={{ top: "4rem", right: "7%", transform: "rotate(15deg)" }}
        />
        <Sticker
          kind="ring"
          color="var(--yellow)"
          size={42}
          style={{ bottom: "1.5rem", left: "10%", opacity: 0.8 }}
        />
        <div className="container">
          <p className="kicker">FEAST YOUR EYES</p>
          <h1>
            THE <span className="accent">Gallery.</span>
          </h1>
          <p className="hero-subtext">Our food, our space, and the good times in between.</p>
        </div>
      </section>
      <GalleryClient photos={photos} />
    </div>
  );
}
