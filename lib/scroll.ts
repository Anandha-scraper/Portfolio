import type { SectionId } from "@/types";

/** Smooth-scroll to a section anchor, respecting reduced-motion. */
export function scrollToSection(id: SectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
