"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/animations/reveal";
import { DungeonMap } from "@/components/project-ecosystem/dungeon-map";
import { cn } from "@/lib/utils";
// Previous projects UI, kept commented in case it's wanted again:
//   import { ProjectFolders } from "@/components/mission-control/project-folders"; // terminal dossier tabs

/**
 * ProjectEcosystem — the Projects section.
 *
 * Rendered as a large, static, explorable top-down dungeon: floor/wall tiles,
 * themed decoration, wandering pixel characters, an aim-reticle cursor, and a
 * treasure chest per project (open it to read the dossier). Pan with the arrow
 * keys or by dragging — see DungeonMap.
 */
export function ProjectEcosystem() {
  // The dungeon spans full width; it only yields room when the sidebar opens.
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
    <section
      id="ecosystem"
      className="ops ops-scanlines relative w-full scroll-mt-24 overflow-hidden"
    >
      {/* Legibility wash — light, and transparent at both edges so the global
          boxed-line grid runs seamlessly into the sections above and below (no
          dark band at the boundaries). */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(20,17,12,0)_0%,rgba(20,17,12,0.18)_45%,rgba(20,17,12,0)_100%)]"
      />

      <div
        className={cn(
          "relative z-10 w-full px-2 py-1 transition-[padding] duration-400 sm:px-3 sm:py-1",
          sidebarOpen && "lg:pl-[290px]"
        )}
      >
        <Reveal delay={0.1}>
          <DungeonMap />
        </Reveal>
      </div>

    </section>
  );
}
