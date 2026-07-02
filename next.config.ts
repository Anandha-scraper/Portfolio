import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a fully static site to ./out for Firebase Hosting (no Node server).
  output: "export",
  // The static export has no Image Optimization server, so serve images as-is.
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
  // Firebase Hosting serves /path -> /path.html; trailing slashes keep the
  // generated paths and asset references aligned with `cleanUrls`.
  trailingSlash: true,
};

export default nextConfig;
