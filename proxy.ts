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

const ADMIN_ENTRY_PATH = "/tpc-staff-portal";
const ADMIN_GATE_COOKIE = "pc_admin_gate";
const ADMIN_GATE_VALUE =
  process.env.ADMIN_GATE_SECRET ?? "tpc-admin-gate-2026";
const ADMIN_GATE_MAX_AGE = 60 * 60 * 24 * 7;

const VERCEL_DEPLOYMENT_SUFFIX = ".vercel.app";
const PRIVATE_PATHS = ["/admin", "/preview"];

function isPrivatePath(pathname: string) {
  return PRIVATE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isDirectVercelDeployment(request: NextRequest) {
  const requestHost = request.headers
    .get("host")
    ?.split(":", 1)[0]
    .toLowerCase();

  return [request.nextUrl.hostname.toLowerCase(), requestHost].some((hostname) =>
    hostname?.endsWith(VERCEL_DEPLOYMENT_SUFFIX),
  );
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Cloudflare Access protects these routes on the canonical production host.
  // Vercel's stable `*.vercel.app` production alias remains directly reachable
  // under Standard Protection, so deny private UI routes there to prevent that
  // alias from becoming an Access bypass. Backend staff APIs still enforce
  // Django authentication independently.
  if (
    isDirectVercelDeployment(request) &&
    (isPrivatePath(path) || path === ADMIN_ENTRY_PATH)
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  // The staff UI still lives at /admin internally, but the public entry point
  // is an unlinked staff URL. This is not a replacement for real staff auth;
  // it hides the login surface until Cloudflare Access/2FA is enabled.
  if (path === ADMIN_ENTRY_PATH) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    const response = NextResponse.redirect(login);
    response.cookies.set(ADMIN_GATE_COOKIE, ADMIN_GATE_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: ADMIN_GATE_MAX_AGE,
    });
    return response;
  }

  if (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/preview" ||
    path.startsWith("/preview/")
  ) {
    if (request.cookies.get(ADMIN_GATE_COOKIE)?.value !== ADMIN_GATE_VALUE) {
      return new NextResponse("Not Found", {
        status: 404,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      });
    }
  }

  if (process.env.MAINTENANCE_MODE !== "1") return NextResponse.next();

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
