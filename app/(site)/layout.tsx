import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Luckiest_Guy, Pacifico, DM_Sans, Baloo_2 } from "next/font/google";
import "../globals.css";
import Announce from "@/components/Announce";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ScrollFx from "@/components/ScrollFx";
import { getAnnouncement, getSite } from "@/lib/api";
import { customThemeStyle } from "@/lib/theme";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const script = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-script" });
const body = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });
const round = Baloo_2({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-round" });
// hero headline: the chunky hand-cut caps from the reference
const display = Luckiest_Guy({ weight: "400", subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "The Pancake Club — Pancakes & Stacks, Sydney",
  description:
    "Fluffy homemade pancakes in Sydney. View the menu, book a table online, and see why locals love The Pancake Club. Real maple, fresh berries, zero guilt.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [site, announcement] = await Promise.all([getSite(), getAnnouncement()]);
  const themeStyle =
    site.theme === "custom" ? customThemeStyle(site.custom_primary, site.custom_accent) : null;
  // Restaurant schema markup for Google's local results — kept in sync with
  // the business details staff manage in the admin panel
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "The Pancake Club",
    url: SITE_URL,
    servesCuisine: "Pancakes, Breakfast, Dessert",
    priceRange: "$$",
    telephone: site.phone,
    email: site.email,
    address: { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "AU" },
    menu: `${SITE_URL}/menu`,
    acceptsReservations: `${SITE_URL}/booking`,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
