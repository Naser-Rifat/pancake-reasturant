/** @type {import('next').NextConfig} */
const nextConfig = {
  // Browser tests use a separate directory so they can run beside the
  // developer's normal `next dev` process without sharing its lock/cache.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Playwright binds the isolated dev server to the loopback IP. Next's dev
  // asset protection otherwise treats that as cross-origin from `localhost`
  // and blocks hydration, leaving client-driven admin/cart flows inert.
  allowedDevOrigins: ["127.0.0.1"],
  // App has multiple root layouts (route groups), so a normal app/not-found
  // can't compose one global 404 for unmatched URLs — use global-not-found.
  experimental: {
    globalNotFound: true,
  },
  images: {
    contentDispositionType: "inline",
    // Restrict image optimization to the hosts actually used (Cloudinary for
    // admin uploads, Unsplash for stock/seed images) so the /_next/image
    // endpoint can't be abused as an open proxy for arbitrary hosts.
    // Add a host here if staff start using another image source.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Baseline security headers on every response. (No strict CSP here — Next's
  // inline runtime would need nonce wiring; these cover the common holes.)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
