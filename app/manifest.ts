import type { MetadataRoute } from "next";

// Installable web app: "Add to Home Screen" opens the site standalone, without
// browser chrome. There is no native app and none is planned — this is what
// "behaves like an app" means here, alongside the bottom tab bar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "The Pancake Club",
    // home screens truncate at ~12 characters
    short_name: "Pancake Club",
    description:
      "Fluffy homemade pancakes in Sydney. Order takeaway for pickup or book a table.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // the site's cream ground, so the splash and status bar match the page
    background_color: "#f8f2e0",
    theme_color: "#f8f2e0",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops icons to its own shape; the maskable variant keeps the
      // stack inside the safe circle instead of losing its corners
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Order Takeaway", url: "/menu" },
      { name: "Book a Table", url: "/booking" },
    ],
  };
}
