import type { Metadata, Viewport } from "next";
import { Pixelify_Sans } from "next/font/google";
import { BackgroundEnvironment } from "@/components/blueprint/background-environment";
import { SkeletonCompanion } from "@/components/companion/skeleton-companion";
import { AssetGallery } from "@/components/ui/asset-gallery";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";
// Per-component plain CSS files, migrated off Tailwind utility classes.
// Next.js's App Router only allows non-Module global CSS to be imported
// from the root layout, so every component's own .css file (co-located
// next to its .tsx) is wired in centrally here rather than self-imported —
// see the doc comment at the top of each file for why.
import "./layout.css";
import "@/components/book/magic-book.css";
import "@/components/project-ecosystem/master.css";
import "@/components/project-ecosystem/project-preview-frame.css";
import "@/components/project-ecosystem/project-dungeon-panel.css";
import "@/components/project-ecosystem/dungeon-map.css";
import "@/components/project-ecosystem/dungeon-hero.css";
import "@/components/project-ecosystem/dungeon-slideshow-controls.css";
import "@/components/project-ecosystem/dungeon-tiles-canvas.css";
import "@/components/project-ecosystem/dungeon-touch-controls.css";
import "@/components/project-ecosystem/dungeon-treasures.css";
import "@/components/project-ecosystem/project-ecosystem.css";
import "@/components/navigation/chest-sidebar.css";
import "@/components/navigation/scroll-progress.css";
import "@/components/mission-control/mission-control.css";
import "@/components/mission-control/name-patrol-sprite.css";
import "@/components/capability-network/capability-network.css";
import "@/components/contact/contact-studio.css";
import "@/components/contact/terminal.css";
import "@/components/blueprint/background-environment.css";
import "@/components/blueprint/section-heading.css";
import "@/components/blueprint/section-shell.css";
import "@/components/companion/skeleton-companion.css";
import "@/components/ui/asset-gallery.css";
import "@/components/ui/dungeon-frame.css";
import "@/components/ui/morphing-text.css";
import "@/components/ui/particles.css";
import "./loading.css";
import "./not-found.css";
import "./page.css";
import "./master/master-console.css";

// Global pixel typeface. next/font self-hosts the files at build time, so this
// stays compatible with the static export (no runtime fetch to Google).
const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Anandha Kumaran M S ",
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
    <html lang="en" suppressHydrationWarning className={pixelify.variable}>
      <body className="root-body">
        <BackgroundEnvironment />
        {/* Cursor companion. mode: "chase" | "rest" | "wander";
            idleDelayMs: 1000 | 2000 | 3000; set debug to tune live. */}
        <SkeletonCompanion mode="chase" idleDelayMs={3000} debug={false} />
        {/* Top-right info panel cataloguing every pixel-art asset on the site. */}
        <AssetGallery />
        <div className="root-content">{children}</div>
      </body>
    </html>
  );
}
