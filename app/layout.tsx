import type { Metadata, Viewport } from "next";
import { BackgroundEnvironment } from "@/components/blueprint/background-environment";
import { SkeletonCompanion } from "@/components/companion/skeleton-companion";
import { AssetGallery } from "@/components/ui/asset-gallery";
import "./globals.css";

const SITE_URL = "https://anandhakumaran.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Anandha Kumaran M S — Full Stack Developer",
    template: "%s · Anandha Kumaran M S",
  },
  description:
    "The Living Blueprint — an interactive portfolio by Anandha Kumaran M S. Full Stack Developer building scalable web apps, CRM systems, and Web3 experiences from Salem, Tamil Nadu.",
  keywords: [
    "Anandha Kumaran",
    "Full Stack Developer",
    "MERN",
    "Next.js",
    "React",
    "Web3",
    "Portfolio",
    "Salem",
  ],
  authors: [{ name: "Anandha Kumaran M S" }],
  creator: "Anandha Kumaran M S",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "Anandha Kumaran M S — Full Stack Developer",
    description:
      "The Living Blueprint — an interactive developer portfolio. Scalable web apps, CRM systems, and Web3 experiences.",
    siteName: "Anandha Kumaran M S",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anandha Kumaran M S — Full Stack Developer",
    description:
      "The Living Blueprint — an interactive developer portfolio.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14110c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-dvh antialiased">
        <BackgroundEnvironment />
        {/* Cursor companion. mode: "chase" | "rest" | "wander";
            idleDelayMs: 1000 | 2000 | 3000; set debug to tune live. */}
        <SkeletonCompanion mode="chase" idleDelayMs={3000} debug={false} />
        {/* Top-right info panel cataloguing every pixel-art asset on the site. */}
        <AssetGallery />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
