import { NextResponse, type NextRequest } from "next/server";
import { maintenanceHtml } from "@/lib/maintenance-page";

// Site-wide maintenance gate. Flipped with an env var (MAINTENANCE_MODE=1) so
// turning the site off and back on is a Vercel setting + redeploy, never a
// code change — the same commit ships in both states, which keeps this file
// conflict-free when design branches merge back into main.
//
// Next 16 renamed `middleware.ts` to `proxy.ts`; the API is unchanged.

// Maintenance stops NEW orders — the storefront is gated, so nobody reaches a
// cart. It must not swallow the receipt for money already taken: a customer who
// was on Stripe's payment page when the switch was flipped comes back to
// /order/success, and a 503 there means a charge with no confirmation, no
// emailed order id, and a cart that never clears.
const ALWAYS_OPEN = ["/order/success"];

const BYPASS_COOKIE = "pc_bypass";
const BYPASS_QUERY = "preview";
const BYPASS_MAX_AGE = 60 * 60 * 24 * 7; // a week of previewing, then re-auth

export function proxy(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "1") return NextResponse.next();

  const path = request.nextUrl.pathname;
  if (ALWAYS_OPEN.some((open) => path === open || path.startsWith(`${open}/`))) {
    return NextResponse.next();
  }

  const secret = process.env.MAINTENANCE_BYPASS_SECRET;

  if (secret) {
    // ?preview=<secret> mints the cookie, then bounces to the clean URL so the
    // secret stops travelling in the address bar, Referer headers and logs.
    if (request.nextUrl.searchParams.get(BYPASS_QUERY) === secret) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete(BYPASS_QUERY);
      const response = NextResponse.redirect(clean);
      response.cookies.set(BYPASS_COOKIE, secret, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: BYPASS_MAX_AGE,
      });
      return response;
    }

    if (request.cookies.get(BYPASS_COOKIE)?.value === secret) {
      return NextResponse.next();
    }
  }

  // 503, not 200: a maintenance page served as a success tells Google this IS
  // the site's content and the real pages get dropped from the index. 503 +
  // Retry-After says "temporary, come back" and rankings survive. No-store
  // keeps the CDN from pinning this page in front of the site after we're up.
  return new NextResponse(maintenanceHtml(), {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": "3600",
      "Cache-Control": "no-store, must-revalidate",
      "X-Robots-Tag": "noarchive",
    },
  });
}

export const config = {
  // Everything except build output and static assets — the holding page needs
  // /logo.png, and the bypass preview needs the real site's chunks and fonts.
  matcher: [
    "/((?!_next/|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$).*)",
  ],
};
