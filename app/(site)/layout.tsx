import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Pacifico, DM_Sans, Baloo_2 } from "next/font/google";
import "../globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollFx from "@/components/ScrollFx";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const script = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-script" });
const body = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body" });
const round = Baloo_2({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-round" });

export const metadata: Metadata = {
  title: "KRUSH | Pancakes & Stacks — Sydney",
  description:
    "Fluffy homemade pancakes in Sydney. View the menu, book a table online, and see why locals love KRUSH. Real maple, fresh berries, zero guilt.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <body className={`${serif.variable} ${script.variable} ${body.variable} ${round.variable}`}>
        <Nav />
        {children}
        <Footer />
        <ScrollFx />
      </body>
    </html>
  );
}
