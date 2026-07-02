import type { NavItem, SectionId } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { id: "mission-control", label: "Mission Control", icon: "Compass" },
  { id: "capabilities", label: "Capabilities", icon: "Network" },
  { id: "ecosystem", label: "Projects", icon: "Boxes" },
  { id: "contact", label: "Contact", icon: "Send" },
];

export const SECTION_IDS: SectionId[] = NAV_ITEMS.map((n) => n.id);
