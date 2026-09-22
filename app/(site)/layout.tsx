import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Luckiest_Guy, Pacifico, DM_Sans, Baloo_2 } from "next/font/google";
import "../globals.css";
import Announce from "@/components/Announce";
import TopRibbon from "@/components/TopRibbon";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ScrollFx from "@/components/ScrollFx";
import CartDrawer from "@/components/CartDrawer";
import CartButton from "@/components/CartButton";
import BottomBar from "@/components/BottomBar";
import { CartProvider } from "@/lib/cart";
import { QueryProvider } from "@/components/QueryProvider";
import { getAnnouncement, getHours, getMenuWithStatus, getReviews, getSite } from "@/lib/api";
import { addressLocality, addressRegion } from "@/lib/format";
import { customThemeStyle } from "@/lib/theme";
import { jsonLd } from "@/lib/utils";
import { aggregateRating, openingHoursSpec } from "@/lib/seo";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const script = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-script" });
const body = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });
const round = Baloo_2({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-round" });
// hero headline: the chunky hand-cut caps from the reference
const display = Luckiest_Guy({ weight: "400", subsets: ["latin"], variable: "--font-display" });

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thepancakeclub.com.au"
).replace(/\/$/, "");
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const locality = addressLocality(site.address);
  const hasLocation = Boolean(site.address.trim());
  const locationSuffix = hasLocation ? ` in ${locality}` : "";
  const title = `The Pancake Club | Fresh Pancakes${locationSuffix}`;
  const description = `Fluffy homemade pancakes${locationSuffix}. Explore our menu, book a table, or visit The Pancake Club.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s | The Pancake Club" },
    description,
    applicationName: "The Pancake Club",
    keywords: [
      `pancakes${locationSuffix}`,
      `breakfast${locationSuffix}`,
      `pancake restaurant${locationSuffix}`,
      `book a table${locationSuffix}`,
      "The Pancake Club",
    ],
    alternates: { canonical: "/" },
    verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: { capable: true, title: "Pancake Club", statusBarStyle: "default" },
    other: { "apple-mobile-web-app-capable": "yes" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: { type: "website", siteName: "The Pancake Club", locale: "en_AU", url: SITE_URL, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

// viewport-fit=cover is what makes env(safe-area-inset-*) resolve to anything
// other than 0 — the hero's bottom CTA and the tab bar both budget for it
export const viewport: Viewport = {
  themeColor: "#f8f2e0",
  colorScheme: "light",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, announcement, hours, reviews, menu] = await Promise.all([
    getSite(),
    getAnnouncement(),
    getHours(),
    getReviews(),
    // the drawer needs names and prices for whatever is in the cart, on every
    // page — not just /menu, which is the only page that used to render it
    getMenuWithStatus(),
  ]);
  const themeStyle =
    site.theme === "custom" ? customThemeStyle(site.custom_primary, site.custom_accent) : null;
  // Site settings express staff intent; menu.live proves the API can currently
  // accept and price an order. Both must be true anywhere a cart can open.
  const orderingLive = site.online_ordering_enabled && menu.live;
  // Restaurant schema markup for Google's local results and generative engines —
  // kept in sync with the business details staff manage in the admin panel
  const rating = aggregateRating(reviews);
  const openingHours = openingHoursSpec(hours);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "The Pancake Club",
    url: SITE_URL,
    image: site.hero_image || `${SITE_URL}/logo.png`,
    logo: `${SITE_URL}/logo.png`,
    servesCuisine: "Pancakes, Breakfast, Dessert",
    priceRange: "$$",
    telephone: site.phone,
    email: site.email,
    ...(site.address.trim()
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: site.address,
            addressLocality: addressLocality(site.address),
            ...(addressRegion(site.address) ? { addressRegion: addressRegion(site.address) } : {}),
          },
        }
      : {}),
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: `${SITE_URL}/booking`,
    ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
    ...(rating ? { aggregateRating: rating } : {}),
  };

  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        data-theme={site.theme}
        style={themeStyle ?? undefined}
        className={`${serif.variable} ${script.variable} ${body.variable} ${round.variable} ${display.variable}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
        {/* the cart wraps everything: the drawer mounts once here, every page's
            cart button opens it, and the tab bar reads its count */}
        <QueryProvider>
        <CartProvider>
          <TopRibbon
            address={site.address}
            facebookUrl={site.facebook_url}
            instagramUrl={site.instagram_url}
            uberEatsUrl={site.uber_eats_url}
          />
          <Announce data={announcement} />
          <Nav
            live={orderingLive}
            facebookUrl={site.facebook_url}
            instagramUrl={site.instagram_url}
            uberEatsUrl={site.uber_eats_url}
            whatsapp={site.whatsapp}
            address={site.address}
          />
          {children}
          <Footer />
          {site.whatsapp &&
           <WhatsAppFloat phone={site.whatsapp} />
           }
          <ScrollFx />
          <BottomBar whatsapp={site.whatsapp} />
          {/* desktop's cart — mobile/tablet use the app header's, which sits
              in Nav. globals.css shows exactly one of them per breakpoint. */}
          <CartButton live={orderingLive} className="cart-fab" size={26} />
          <CartDrawer
            items={menu.items}
            live={orderingLive}
            uberEatsUrl={site.uber_eats_url}
            orderPrepTime={site.order_prep_time || "15–20 mins"}
          />
        </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
