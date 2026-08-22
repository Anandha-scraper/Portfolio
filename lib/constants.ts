import type { NavItem, SectionId } from "@/types";

/** Canonical production URL — shared by layout metadata, robots.ts, and sitemap.ts. */
export const SITE_URL = "https://anandhakumaran.dev";

/** GA4 Measurement ID — shared by layout.tsx (loader) and lib/analytics.ts (events). */
export const GA_MEASUREMENT_ID = "G-461F7F916H";

export const NAV_ITEMS: NavItem[] = [
  { id: "mission-control", label: "Mission Control", icon: "Compass" },
  { id: "ecosystem", label: "Projects", icon: "Boxes" },
  { id: "capabilities", label: "Capabilities", icon: "Network" },
  { id: "contact", label: "Contact", icon: "Send" },
];

export const SECTION_IDS: SectionId[] = NAV_ITEMS.map((n) => n.id);
