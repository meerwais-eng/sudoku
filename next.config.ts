import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
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