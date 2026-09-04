/** @type {import('next').NextConfig} */
const nextConfig = {
  // App has multiple root layouts (route groups), so a normal app/not-found
  // can't compose one global 404 for unmatched URLs — use global-not-found.
  experimental: {
    globalNotFound: true,
  },
  images: {
    // Restrict image optimization to the hosts actually used (Cloudinary for
    // admin uploads, Unsplash for stock/seed images) so the /_next/image
    // endpoint can't be abused as an open proxy for arbitrary hosts.
    // Add a host here if staff start using another image source.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
