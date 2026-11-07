import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The storefront is per-user (session + cart cookies, live DB reads), so the
  // Cache Components model doesn't fit; pages opt into dynamic rendering instead.
  cacheComponents: false,
  devIndicators: false,
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
