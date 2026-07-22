"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/animations/reveal";
import { DungeonMap } from "@/components/project-ecosystem/dungeon-map";
import { cn } from "@/lib/utils";

/**
 * ProjectEcosystem — the Projects section.
 *
 * A top-down pixel dungeon (floor/wall tiles, themed decoration, an
 * aim-reticle cursor) that defaults to an auto-advancing slideshow through
 * every project, with an opt-in "Playground" mode handing control to a
 * walkable hero (WASD/arrows, or drag/touch controls on mobile) — see
 * DungeonMap.
 */
export function ProjectEcosystem() {
  // The dungeon spans full width; it only yields room when the chest sidebar is open.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setSidebarOpen(true);
    const onClose = () => setSidebarOpen(false);
    window.addEventListener("chest-sidebar-open", onOpen);
    window.addEventListener("chest-sidebar-close", onClose);
    return () => {
      window.removeEventListener("chest-sidebar-open", onOpen);
      window.removeEventListener("chest-sidebar-close", onClose);
    };
  }, []);

  return (
    <section id="ecosystem" className={cn("project-ecosystem__section", "ops", "ops-scanlines")}>
      {/* Legibility wash — light, and transparent at both edges so the global
          boxed-line grid runs seamlessly into the sections above and below (no
          dark band at the boundaries). */}
      <div aria-hidden className="project-ecosystem__wash" />

      <div
        className={cn(
          "project-ecosystem__content",
          sidebarOpen && "project-ecosystem__content--sidebar-open"
        )}
      >
        <Reveal delay={0.1}>
          <DungeonMap />
        </Reveal>
      </div>

    </section>
  );
}
