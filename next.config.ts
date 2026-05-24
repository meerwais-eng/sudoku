import type { NextConfig } from "next";
import os from "os";

const isAndroidBuild = process.env.BUILD_TARGET === "android";
const isPWAExport = process.env.BUILD_TARGET === "pwa";

// Detect local network IPs to allow cross-origin HMR access from mobile devices
function getLocalNetworkIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      // Skip internal/non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  // Use static export for Android/PWA builds, standalone for server deployment
  output: isAndroidBuild || isPWAExport ? "export" : "standalone",
  
  // Disable image optimization for static exports (no server to process images)
  images: isAndroidBuild || isPWAExport ? { unoptimized: true } : undefined,
  
  // Add trailing slash for static exports (ensures directories work correctly)
  trailingSlash: isAndroidBuild || isPWAExport ? true : undefined,
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  reactStrictMode: false,
  
  // Allow cross-origin access from local network IPs for mobile dev testing
  allowedDevOrigins: getLocalNetworkIPs(),
};

export default nextConfig;
