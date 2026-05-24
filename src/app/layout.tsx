import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06b6d4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("/", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: "Sudoku Prime - Premium Puzzle Game",
  description:
    "A beautiful, modern Sudoku puzzle game with glassmorphic design, achievements, statistics, and full offline support.",
  keywords: ["Sudoku", "Puzzle", "Game", "Brain Teaser", "PWA", "Offline", "Sudoku Prime"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sudoku Prime",
    startupImage: [
      { url: "/apple-splash-640.png", media: "(device-width: 320px)" },
      { url: "/apple-splash-750.png", media: "(device-width: 375px)" },
      { url: "/apple-splash-828.png", media: "(device-width: 414px)" },
      { url: "/apple-splash-1080.png", media: "(device-width: 540px)" },
      { url: "/apple-splash-1125.png", media: "(device-width: 375px) and (device-height: 812px)" },
      { url: "/apple-splash-1170.png", media: "(device-width: 390px) and (device-height: 844px)" },
      { url: "/apple-splash-1242.png", media: "(device-width: 414px) and (device-height: 896px)" },
      { url: "/apple-splash-1290.png", media: "(device-width: 428px) and (device-height: 926px)" },
      { url: "/apple-splash-1536.png", media: "(device-width: 768px)" },
      { url: "/apple-splash-1668.png", media: "(device-width: 834px)" },
      { url: "/apple-splash-2048.png", media: "(device-width: 1024px)" },
    ],
  },
  openGraph: {
    title: "Sudoku Prime - Premium Puzzle Game",
    description:
      "A beautiful, modern Sudoku puzzle game with glassmorphic design, achievements, and full offline support.",
    type: "website",
    siteName: "Sudoku Prime",
    images: [{ url: "/icon-512x512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "Sudoku Prime - Premium Puzzle Game",
    description: "Beautiful Sudoku puzzle game with offline support.",
    images: [{ url: "/icon-512x512.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Core PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Sudoku Prime" />

        {/* iOS / Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sudoku Prime" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* iOS Splash Screens (generated images needed) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png" />

        {/* iOS Launch Images (splash screens) */}
        <link rel="apple-touch-startup-image" href="/apple-splash-640.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-750.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-828.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1125.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1170.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1242.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1290.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1536.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1668.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-2048.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />

        {/* Favicon fallbacks */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />

        {/* Format Detection — prevent auto-linking of phone numbers */}
        <meta name="format-detection" content="telephone=no" />

        {/* Theme color for older browsers */}
        <meta name="theme-color" content="#06b6d4" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
