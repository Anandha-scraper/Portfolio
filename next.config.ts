import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root: an unrelated lockfile at ~/package-lock.json
  // otherwise gets picked up, breaking Turbopack's module resolution.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow local browser tooling to connect to the Next.js HMR endpoint.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
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
