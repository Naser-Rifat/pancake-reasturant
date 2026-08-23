import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Pacifico, DM_Sans, Baloo_2 } from "next/font/google";
import "../globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollFx from "@/components/ScrollFx";
import { getSite } from "@/lib/api";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const script = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-script" });
const body = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });
const round = Baloo_2({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-round" });

export const metadata: Metadata = {
  title: "KRUSH | Pancakes & Stacks — Sydney",
  description:
    "Fluffy homemade pancakes in Sydney. View the menu, book a table online, and see why locals love KRUSH. Real maple, fresh berries, zero guilt.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const site = await getSite();
  // Restaurant schema markup for Google's local results — kept in sync with
  // the business details staff manage in the admin panel
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "KRUSH Pancakes & Stacks",
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
      <body className={`${serif.variable} ${script.variable} ${body.variable} ${round.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <Nav />
        {children}
        <Footer />
        <ScrollFx />
      </body>
    </html>
  );
}
