import { ImageResponse } from "next/og";

// Branded 1200×630 card shown when the site is shared on WhatsApp, Facebook,
// iMessage, Slack, X, etc. Generated at request time so no design asset is
// needed and it always matches the brand colours.
export const alt = "The Pancake Club — Pancakes & Stacks, Sydney";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 8, textTransform: "uppercase", opacity: 0.75 }}>
          Sydney
        </div>
        <div style={{ fontSize: 132, fontWeight: 900, lineHeight: 1, marginTop: 12, display: "flex" }}>
          The Pancake Club
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 32, opacity: 0.85, display: "flex" }}>
          Fluffy homemade pancakes · griddled to order
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 40, padding: "16px 36px", borderRadius: 999, background: "#2B1D0E", color: "#F6C453", display: "flex" }}>
          View the menu & book a table
        </div>
      </div>
    ),
    { ...size }
  );
}
