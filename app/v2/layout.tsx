import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Baloo_2, DM_Sans } from "next/font/google";
import ScrollFx from "@/components/ScrollFx";
import "./v2.css";

const display = Baloo_2({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-v2-display" });
const body = DM_Sans({ weight: ["500", "600", "700", "800"], subsets: ["latin"], variable: "--font-v2-body" });

export const metadata: Metadata = {
  title: "The Pancake Club — Design V2 Preview",
  robots: { index: false, follow: false },
};

// Standalone root layout — isolated from (site) and (admin). This route exists
// purely as a design comparison for the client; whichever direction they pick,
// the other gets deleted.
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <body className={`v2 ${display.variable} ${body.variable}`}>{children}<ScrollFx /></body>
    </html>
  );
}
