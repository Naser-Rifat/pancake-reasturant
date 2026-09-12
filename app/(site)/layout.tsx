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
import { getAnnouncement, getHours, getMenuWithStatus, getReviews, getSite } from "@/lib/api";
import { customThemeStyle } from "@/lib/theme";
import { jsonLd } from "@/lib/utils";
import { aggregateRating, openingHoursSpec } from "@/lib/seo";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const script = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-script" });
const body = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });
const round = Baloo_2({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-round" });
// hero headline: the chunky hand-cut caps from the reference
const display = Luckiest_Guy({ weight: "400", subsets: ["latin"], variable: "--font-display" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const SITE_TITLE = "The Pancake Club — Pancakes & Stacks, Geelong";
const SITE_DESC =
  "Fluffy homemade pancakes in Geelong. View the menu, book a table online, and see why locals love The Pancake Club. Real maple, fresh berries, zero guilt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | The Pancake Club",
  },
  description: SITE_DESC,
  applicationName: "The Pancake Club",
  keywords: [
    "pancakes Geelong",
    "breakfast Geelong",
    "pancake restaurant Geelong",
    "book a table Geelong",
    "The Pancake Club",
  ],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // iOS reads these, not the manifest, to launch standalone from the home screen
  appleWebApp: {
    capable: true,
    title: "Pancake Club",
    statusBarStyle: "default",
  },
  // Next emits the standardised mobile-web-app-capable; Safari before 16.4 only
  // launches standalone off the apple- prefixed one
  other: { "apple-mobile-web-app-capable": "yes" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "The Pancake Club",
    locale: "en_AU",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

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
    servesCuisine: "Pancakes, Breakfast, Dessert",
    priceRange: "$$",
    telephone: site.phone,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: "Geelong West",
      addressRegion: "VIC",
      addressCountry: "AU",
    },
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: `${SITE_URL}/booking`,
    ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
    ...(rating ? { aggregateRating: rating } : {}),
  };

  return (
    <html lang="en-AU">
      <body
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
        <CartProvider>
          <TopRibbon
            address={site.address}
            facebookUrl={site.facebook_url}
            instagramUrl={site.instagram_url}
            uberEatsUrl={site.uber_eats_url}
          />
          <Announce data={announcement} />
          <Nav
            live={site.online_ordering_enabled}
            facebookUrl={site.facebook_url}
            instagramUrl={site.instagram_url}
            uberEatsUrl={site.uber_eats_url}
          />
          {children}
          <Footer />
          {site.whatsapp &&
           <WhatsAppFloat phone={site.whatsapp} />
           }
          <ScrollFx />
          <BottomBar />
          {/* desktop's cart — mobile/tablet use the app header's, which sits
              in Nav. globals.css shows exactly one of them per breakpoint. */}
          <CartButton live={site.online_ordering_enabled} className="cart-fab" size={26} />
          <CartDrawer
            items={menu.items}
            live={site.online_ordering_enabled}
            uberEatsUrl={site.uber_eats_url}
          />
        </CartProvider>
      </body>
    </html>
  );
}
