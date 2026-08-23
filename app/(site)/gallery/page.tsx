import type { Metadata } from "next";
import GalleryClient from "@/components/GalleryClient";
import { getGallery } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | The Pancake Club",
  description: "Photos from The Pancake Club — our food, our space, and the good times in between.",
};

export default async function GalleryPage() {
  const photos = await getGallery();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="kicker">Feast Your Eyes</p>
          <h1>The <span className="accent">Gallery.</span></h1>
          <p>Our food, our space, and the good times in between.</p>
        </div>
      </section>
      <GalleryClient photos={photos} />
    </>
  );
}
