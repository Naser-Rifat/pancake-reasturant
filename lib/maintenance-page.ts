// Maintenance page markup, served straight from `proxy.ts` with a 503.
//
// Deliberately a self-contained HTML string, not a React route: whatever puts
// the site into maintenance (a bad deploy, a dead API, a half-migrated schema)
// must not be able to take this page down too. It renders with zero app code,
// zero data fetching and one optional asset (/logo.png, which the proxy
// matcher lets through). Google Fonts is progressive — the fallback stack
// carries the layout if it never loads.
export function maintenanceHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Back soon — The Pancake Club</title>
<meta name="theme-color" content="#f8f2e0">
<link rel="icon" href="/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --cream: #f8f2e0;
    --cream-card: #fdf9ee;
    --gold: #f5de7a;
    --ink: #211a14;
    --muted: #6f6455;
    --berry: #763a12;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
    background: var(--cream);
    /* the storefront's lavender/gold page frame, kept so the holding page
       still reads as the same brand and not a generic error screen */
    border: 8px solid var(--gold);
    font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    color: var(--ink);
    -webkit-text-size-adjust: 100%;
  }
  .card {
    width: 100%;
    max-width: 520px;
    padding: 40px 24px 36px;
    border-radius: 40px;
    background: var(--cream-card);
    text-align: center;
  }
  .logo {
    display: block;
    width: 176px;
    max-width: 62%;
    aspect-ratio: 529 / 226;
    height: auto;
    margin: 0 auto 28px;
  }
  h1 {
    margin: 0 0 14px;
    font-family: "Luckiest Guy", "DM Sans", system-ui, sans-serif;
    font-weight: 400;
    font-size: clamp(2rem, 9vw, 2.75rem);
    line-height: 1.06;
    letter-spacing: 0.01em;
    color: var(--berry);
  }
  p {
    margin: 0 auto;
    max-width: 34ch;
    font-size: 1.0625rem;
    line-height: 1.6;
    color: var(--muted);
  }
  .rule {
    width: 56px;
    height: 4px;
    margin: 26px auto 0;
    border-radius: 999px;
    background: var(--gold);
  }
  @media (min-width: 640px) {
    body { border-width: 12px; }
    .card { padding: 56px 48px 52px; }
  }
</style>
</head>
<body>
  <main class="card">
    <img class="logo" src="/logo.png" alt="The Pancake Club" width="529" height="226">
    <h1>We&rsquo;ll be back soon</h1>
    <p>The site is down for a short spell of maintenance. Thanks for your patience &mdash; check back in a little while.</p>
    <div class="rule" role="presentation"></div>
  </main>
</body>
</html>`;
}
