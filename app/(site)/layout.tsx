import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Luckiest_Guy, Pacifico, DM_Sans, Baloo_2 } from "next/font/google";
import "../globals.css";
import Announce from "@/components/Announce";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ScrollFx from "@/components/ScrollFx";
import { getAnnouncement, getHours, getReviews, getSite } from "@/lib/api";
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

const SITE_TITLE = "The Pancake Club — Pancakes & Stacks, Sydney";
const SITE_DESC =
  "Fluffy homemade pancakes in Sydney. View the menu, book a table online, and see why locals love The Pancake Club. Real maple, fresh berries, zero guilt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | The Pancake Club",
  },
  description: SITE_DESC,
  applicationName: "The Pancake Club",
  keywords: [
    "pancakes Sydney",
    "breakfast Sydney",
    "pancake restaurant",
    "book a table Sydney",
    "The Pancake Club",
  ],
  alternates: { canonical: "/" },
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, announcement, hours, reviews] = await Promise.all([
    getSite(),
    getAnnouncement(),
    getHours(),
    getReviews(),
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
      addressLocality: "Sydney",
      addressRegion: "NSW",
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
        <Announce data={announcement} />
        <Nav />
        {children}
        <Footer />
        {site.whatsapp &&
         <WhatsAppFloat phone={site.whatsapp} />
         }
        <ScrollFx />
      </body>
    </html>
  );
}
