/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Menu/gallery/hero image URLs are entered by staff in the admin panel and
    // may point at any host (Unsplash, Cloudinary, the client's own storage),
    // so allow any https origin. Local /menu and /logo assets need no entry.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
