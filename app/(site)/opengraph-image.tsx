import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Branded 1200×630 card shown when the site is shared on WhatsApp, Facebook,
// iMessage, Slack, X, etc. Generated at request time. The real logo is read
// from /public and inlined so the preview shows our actual brand mark.
export const alt = "The Pancake Club — Pancakes & Stacks, Sydney";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F6C453 0%, #EBA83A 100%)",
          color: "#2B1D0E",
          fontFamily: "sans-serif",
          padding: "72px",
          textAlign: "center",
        }}
      >
        {/* White card so the logo's warm tones read clearly against the gold */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFDF7",
            borderRadius: 36,
            padding: "40px 72px",
            boxShadow: "0 20px 50px rgba(43,29,14,0.18)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="The Pancake Club" width={460} height={187} />
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 40, opacity: 0.9, display: "flex" }}>
          Fluffy homemade pancakes · griddled to order
        </div>
        <div
          style={{
            fontSize: 29,
            fontWeight: 700,
            marginTop: 30,
            padding: "16px 36px",
            borderRadius: 999,
            background: "#2B1D0E",
            color: "#F6C453",
            display: "flex",
          }}
        >
          View the menu & book a table
        </div>
      </div>
    ),
    { ...size }
  );
}
