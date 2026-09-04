// Global 404 for URLs that match no route at all (e.g. /asdad). Because the app
// uses per-group root layouts, there's no single layout to compose a normal
// not-found from — this file bypasses layouts and returns its own document.
// Enabled via `experimental.globalNotFound` in next.config.mjs.
import "./globals.css";

export const metadata = {
  title: "Page not found — The Pancake Club",
  description: "The page you are looking for doesn’t exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          padding: "2rem",
          background: "#F6C453",
          color: "#2B1D0E",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "4rem", margin: 0, fontWeight: 800, lineHeight: 1 }}>404</h1>
        <p style={{ fontSize: "1.25rem", margin: 0 }}>This page doesn’t exist 🥞</p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="/"
            style={{
              background: "#2B1D0E",
              color: "#F6C453",
              padding: "0.6rem 1.5rem",
              borderRadius: "999px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Back home
          </a>
          <a
            href="/menu"
            style={{
              border: "2px solid #2B1D0E",
              color: "#2B1D0E",
              padding: "0.6rem 1.5rem",
              borderRadius: "999px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            See the menu
          </a>
        </div>
      </body>
    </html>
  );
}
