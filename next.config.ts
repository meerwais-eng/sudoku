import type { NextConfig } from "next";

// Static export is needed for:
//  - GitHub Pages deployment (NEXT_STATIC_EXPORT=true)
//  - Android APK build (BUILD_TARGET=android) — produces out/ for Capacitor sync
const isStaticExport =
  process.env.NEXT_STATIC_EXPORT === "true" ||
  process.env.BUILD_TARGET === "android";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.12',
    '192.168.1.12:3000',
  ],
  output: isStaticExport ? "export" : undefined,
  basePath: isStaticExport ? basePath : undefined,
  images: isStaticExport
    ? { unoptimized: true }
    : {
        formats: ["image/avif", "image/webp"],
      },
  trailingSlash: isStaticExport ? true : false,
  reactStrictMode: true,
};

export default nextConfig;