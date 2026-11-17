import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The storefront is per-user (session + cart cookies, live DB reads), so the
  // Cache Components model doesn't fit; pages opt into dynamic rendering instead.
  cacheComponents: false,
  devIndicators: false,
  images: {
    formats: ["image/webp"],
    // The source photos are ~3.5 MB PNGs: resize once, then keep the result for a month.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [{ protocol: "https", hostname: "images.dailyobjects.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
